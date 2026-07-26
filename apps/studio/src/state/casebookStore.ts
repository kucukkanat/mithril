/*
 * The casebook store — owns the cases and the act of checking them.
 *
 * Checking is MANUAL by design. A re-check is N real agent runs: against a cloud model that is the
 * user's tokens and their key, and against the on-device model it is real seconds. So a spec edit
 * marks verdicts stale (see gradeCase) and waits to be asked, rather than quietly spending on every
 * keystroke.
 *
 * Cases run sequentially through a dedicated runner client, separate from the Run view's
 * interactive one — a background re-check must never overwrite the chat you are reading.
 */
import { create } from "zustand";
import { createRunnerClient, type RunnerClient } from "@mithril/runner-web";
import { generateProject, type ProjectSpec } from "@mithril/spec";
import { loadCases, newCaseId, saveCases } from "../lib/casebook-db.ts";
import { newRunId, recordRun } from "../lib/run-archive.ts";
import { matchesBaseline, shapeOf, type Case, type RunShape } from "../lib/casebook.ts";

/** How a case run is executed — supplied by the caller so this store never reads settings itself. */
export interface CheckContext {
  readonly spec: ProjectSpec;
  /** Provider keys, as generated code expects them on `process.env`. */
  readonly env: Readonly<Record<string, string>>;
  /** Local models download once and can be slow; they must not race a wall-clock timeout. */
  readonly local: boolean;
}

export interface CasebookState {
  readonly projectId: string | null;
  readonly cases: readonly Case[];
  /** Case ids currently mid-run, so the strip can pulse exactly those cards. */
  readonly checking: readonly string[];
  /** Cases that went from passing to failing on the most recent check — the design's "broke" cue. */
  readonly broke: readonly string[];
  /** The last case deleted, held for undo. */
  readonly deleted: { readonly index: number; readonly value: Case } | null;

  open(projectId: string): Promise<void>;
  add(input: string): string;
  edit(id: string, input: string): void;
  remove(id: string): void;
  undoRemove(): void;
  dismissDeleted(): void;
  /** Accept the last run as the baseline this case is graded against from now on. */
  accept(id: string): void;
  /** Run one case and record its shape. */
  check(id: string, ctx: CheckContext): Promise<void>;
  /** Run every case, in order. */
  checkAll(ctx: CheckContext): Promise<void>;
  clearBroke(): void;
}

/** Wall-clock ceiling for a single cloud case run. Local runs opt out — a download can exceed it. */
const CASE_TIMEOUT_MS = 120_000;

let runner: RunnerClient | null = null;
const client = (): RunnerClient => {
  runner ??= createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" }));
  return runner;
};

/**
 * Run one program to completion and hand back its event stream.
 *
 * Resolves on `done` or `error` — never rejects, because a case that errors is a legitimate
 * observation about the agent (it becomes an `errored` shape), not a failure of the check itself.
 */
function runToCompletion(code: string, ctx: CheckContext, archive?: { readonly projectId: string; readonly caseId: string | null; readonly input: string }): Promise<RunShape> {
  const c = client();
  return new Promise((resolve) => {
    const unsubscribe = c.subscribe(() => {
      const snap = c.getSnapshot();
      if (snap.status !== "done" && snap.status !== "error") return;
      unsubscribe();
      // Keep the events BEFORE reducing them to a shape. Extracting the verdict and dropping the stream is
      // what made a failed check undiagnosable: you could see that it failed, never what the model did.
      if (archive !== undefined) {
        void recordRun(archive.projectId, {
          id: newRunId(),
          at: Date.now(),
          caseId: archive.caseId,
          input: archive.input,
          status: snap.status === "error" ? "error" : "done",
          events: snap.events,
        });
      }
      resolve(shapeOf(snap.events));
    });
    c.run(code, {
      env: ctx.env,
      idleTimeoutMs: ctx.local ? null : CASE_TIMEOUT_MS,
      timeoutMessage: "The case timed out — the provider took too long to respond.",
    });
  });
}

export const useCasebookStore = create<CasebookState>()((set, get) => {
  const persist = (cases: readonly Case[]): void => {
    const { projectId } = get();
    if (projectId !== null) void saveCases(projectId, cases);
  };

  const write = (next: readonly Case[]): void => {
    set({ cases: next });
    persist(next);
  };

  const patch = (id: string, mutate: (c: Case) => Case): void => {
    write(get().cases.map((c) => (c.id === id ? mutate(c) : c)));
  };

  return {
    projectId: null,
    cases: [],
    checking: [],
    broke: [],
    deleted: null,

    async open(projectId) {
      set({ projectId, cases: [], checking: [], broke: [], deleted: null });
      const cases = await loadCases(projectId);
      // A project switch mid-load must not adopt the outgoing project's cases.
      if (get().projectId === projectId) set({ cases });
    },

    add(input) {
      const id = newCaseId();
      write([...get().cases, { id, input, baseline: null, last: null, checkedAt: null }]);
      return id;
    },

    edit(id, input) {
      // Editing the input invalidates the baseline — it was accepted for a different question.
      patch(id, (c) => ({ ...c, input, baseline: null, last: null, checkedAt: null }));
    },

    remove(id) {
      const { cases } = get();
      const index = cases.findIndex((c) => c.id === id);
      const value = cases[index];
      if (value === undefined) return;
      set({ deleted: { index, value } });
      write(cases.filter((c) => c.id !== id));
    },

    undoRemove() {
      const { deleted, cases } = get();
      if (deleted === null) return;
      const next = [...cases];
      next.splice(Math.min(deleted.index, next.length), 0, deleted.value);
      set({ deleted: null });
      write(next);
    },

    dismissDeleted() {
      set({ deleted: null });
    },

    accept(id) {
      patch(id, (c) => (c.last === null ? c : { ...c, baseline: c.last }));
    },

    async check(id, ctx) {
      const target = get().cases.find((c) => c.id === id);
      if (target === undefined) return;
      set({ checking: [...get().checking, id] });
      const code = generateProject({ ...ctx.spec, entry: { ...ctx.spec.entry, input: target.input } });
      const { projectId } = get();
      const shape = await runToCompletion(code, ctx, projectId === null ? undefined : { projectId, caseId: id, input: target.input });
      // The case may have been deleted or the project switched while the run was in flight.
      const still = get().cases.find((c) => c.id === id);
      set({ checking: get().checking.filter((x) => x !== id) });
      if (still === undefined) return;
      // "Broke" means it used to pass and now does not — the only transition worth an animation.
      const base = still.baseline;
      if (base !== null && still.last !== null && matchesBaseline(base, still.last) && !matchesBaseline(base, shape)) {
        set({ broke: [...get().broke, id] });
      }
      patch(id, (c) => ({ ...c, last: shape, checkedAt: Date.now() }));
    },

    async checkAll(ctx) {
      set({ broke: [] });
      // Snapshot the ids up front: `check` writes to `cases`, and the list may change under us.
      for (const id of get().cases.map((c) => c.id)) await get().check(id, ctx);
    },

    clearBroke() {
      set({ broke: [] });
    },
  };
});
