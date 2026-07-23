/*
 * The project store — owner of the two-way sync between the spec (structured truth) and the code
 * view (full-file TypeScript). Flow:
 *
 *   spec edit (panel/canvas) ──generateProject (sync, zero-dep)──▶ code view
 *   code edit ──300ms debounce──▶ ts-worker parseProject ──▶ spec (or: freeze on diagnostics)
 *
 * An `origin` tag on each code update prevents echo loops: codegen-driven editor updates don't
 * re-enter the parser. On parse errors the LAST-GOOD spec is kept (panels freeze, diagnostics show
 * in the gutter) — the spec never regresses to a guess. Accepted spec changes autosave (500ms).
 *
 * On load, a spec is normalized: if its generated code is inconsistent (uses a framework symbol it
 * doesn't import — e.g. a spec persisted by an older parser that dropped an import), it is reparsed
 * once through the current parser, which restores the import and re-structures the decl. This
 * self-heals stale specs so a project can never load into un-runnable code.
 */
import { create } from "zustand";
import { generateProject, type ProjectSpec } from "@mithril/spec";
import type { ParseDiagnostic, ParseResult } from "@mithril/spec/parse";
import type { TsParseRequest, TsParseResponse } from "../ts/ts-worker.ts";
import { loadProject, saveProject } from "../lib/db.ts";

export interface ProjectState {
  readonly projectId: string | null;
  readonly spec: ProjectSpec | null;
  /** The code view's current text (generated, or hand-edited ahead of a successful parse). */
  readonly code: string;
  /** True while the code view has edits the parser could not lift into the spec. */
  readonly codeDirty: boolean;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly opaqueCount: number;
  /** True once the user hand-edited code this session (drives the live-run confirm gate). */
  readonly handEdited: boolean;
  readonly loading: boolean;
  /** Autosave status, surfaced in the TopBar so a no-account app still feels trustworthy. */
  readonly saving: boolean;
  readonly savedAt: number | null;

  open(id: string): Promise<void>;
  close(): void;
  /** Apply a structured edit; regenerates the code view and autosaves. */
  updateSpec(mutate: (spec: ProjectSpec) => ProjectSpec): void;
  /** Text changed in the code view; parse is debounced into the ts-worker. */
  updateCode(code: string): void;
}

const PARSE_DEBOUNCE_MS = 300;
const SAVE_DEBOUNCE_MS = 500;

let worker: Worker | null = null;
let requestSeq = 0;
const pending = new Map<number, (r: ParseResult) => void>();
let parseTimer: ReturnType<typeof setTimeout> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Send one parse request to the (lazily-created) ts-worker; resolves with its result. */
function postParse(source: string, prev: ProjectSpec | undefined): Promise<ParseResult> {
  if (worker === null) {
    worker = new Worker(new URL("../ts/ts-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (ev: MessageEvent<TsParseResponse>) => {
      const resolve = pending.get(ev.data.id);
      if (resolve !== undefined) {
        pending.delete(ev.data.id);
        resolve(ev.data.result);
      }
    };
  }
  requestSeq++;
  const id = requestSeq;
  const req: TsParseRequest = { id, source, ...(prev === undefined ? {} : { prev }) };
  return new Promise((resolve) => {
    pending.set(id, resolve);
    worker?.postMessage(req);
  });
}

// The framework constructors that must be imported from "mithril" wherever they're called. A spec
// whose generated code calls one without importing it is inconsistent and needs re-normalizing.
const MITHRIL_CALLEES = ["agent", "tool", "asTool"] as const;

/** True if the generated code calls a framework constructor it never imports. */
function looksInconsistent(code: string): boolean {
  return MITHRIL_CALLEES.some((sym) => {
    const used = new RegExp(`(^|[^.\\w])${sym}\\(`, "m").test(code);
    const imported = new RegExp(`import\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from`, "m").test(code);
    return used && !imported;
  });
}

const opaqueCountOf = (spec: ProjectSpec): number => spec.decls.filter((d) => d.kind === "opaque").length;

export const useProjectStore = create<ProjectState>()((set, get) => {
  const scheduleSave = (): void => {
    if (saveTimer !== null) clearTimeout(saveTimer);
    // Capture the edit target NOW, not at fire time: switching projects within the debounce window must
    // not misroute the write to the new project (or drop the outgoing project's last edit).
    const { projectId, spec } = get();
    if (projectId === null || spec === null) return;
    set({ saving: true });
    saveTimer = setTimeout(() => {
      void saveProject(projectId, spec)
        .then(() => { if (get().projectId === projectId) set({ saving: false, savedAt: Date.now() }); })
        .catch(() => { if (get().projectId === projectId) set({ saving: false }); }); // never strand the indicator on "Saving…"
    }, SAVE_DEBOUNCE_MS);
  };

  const acceptParse = (result: ParseResult, sourceAtRequest: string): void => {
    if (get().code !== sourceAtRequest) return; // a newer edit is in flight — drop this result
    if (result.spec !== undefined) {
      set({ spec: result.spec, codeDirty: false, diagnostics: result.diagnostics, opaqueCount: result.opaqueCount });
      scheduleSave();
    } else {
      // Syntax error or no entry: keep the last-good spec, surface diagnostics, freeze panels.
      set({ diagnostics: result.diagnostics, opaqueCount: result.opaqueCount, codeDirty: true });
    }
  };

  return {
    projectId: null,
    spec: null,
    code: "",
    codeDirty: false,
    diagnostics: [],
    opaqueCount: 0,
    handEdited: false,
    loading: false,
    saving: false,
    savedAt: null,

    async open(id) {
      set({ loading: true, projectId: id, spec: null, code: "", diagnostics: [], codeDirty: false, handEdited: false });
      const rec = await loadProject(id);
      if (rec === undefined) {
        set({ loading: false, projectId: null });
        return;
      }
      if (get().projectId !== id) return; // opened another project while loading
      let spec = rec.spec;
      let code = generateProject(spec);
      // Self-heal a stale/inconsistent spec (e.g. one an older parser saved with a dropped import)
      // by reparsing its code through the current parser before the project becomes runnable.
      if (looksInconsistent(code)) {
        const result = await postParse(code, spec);
        if (get().projectId !== id) return;
        if (result.spec !== undefined) {
          spec = result.spec;
          code = generateProject(spec);
          void saveProject(id, spec);
        }
      }
      set({ loading: false, spec, code, diagnostics: [], opaqueCount: opaqueCountOf(spec) });
    },

    close() {
      if (parseTimer !== null) clearTimeout(parseTimer);
      if (saveTimer !== null) clearTimeout(saveTimer);
      set({ projectId: null, spec: null, code: "", codeDirty: false, diagnostics: [], handEdited: false });
    },

    updateSpec(mutate) {
      const { spec } = get();
      if (spec === null) return;
      const next = mutate(spec);
      // Spec is truth: regenerate the code view (origin: spec — never re-parsed).
      set({ spec: next, code: generateProject(next), codeDirty: false, diagnostics: [], opaqueCount: opaqueCountOf(next) });
      scheduleSave();
    },

    updateCode(code) {
      const { spec, code: current } = get();
      if (code === current) return;
      set({ code, codeDirty: true, handEdited: true });
      if (parseTimer !== null) clearTimeout(parseTimer);
      parseTimer = setTimeout(() => {
        void postParse(code, spec ?? undefined).then((result) => acceptParse(result, code));
      }, PARSE_DEBOUNCE_MS);
    },
  };
});
