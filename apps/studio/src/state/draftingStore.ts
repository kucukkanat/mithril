/*
 * Drafting orchestration + the preview gate.
 *
 * The gate is the point of this store. Nothing is ever sent because a component felt like it: a
 * request becomes `pending`, the UI shows the user the exact prompt text, and only `confirm()`
 * executes it. With `previewFirst` off the gate is skipped, but it is still one explicit user action
 * that started it — there is no path here that fires on its own.
 */
import { create } from "zustand";
import { createRunnerClient, type RunnerClient } from "@mithril/runner-web";
import type { JsonValue } from "@mithril/core/protocol";
import type { ModelSpec } from "@mithril/spec";
import {
  draftProgram,
  parseDescriptionDraft,
  parseSpecDraft,
  promptFor,
  type DescriptionDraft,
  type DraftRequest,
  type SpecDraft,
} from "../lib/drafting.ts";

/** A request awaiting the user's go-ahead. */
export interface PendingDraft {
  /** The exact text that will be sent — what the gate renders. */
  readonly prompt: string;
  /** The model it will run on, resolved at request time. */
  readonly model: ModelSpec;
}

export type DraftOutcome =
  | { readonly ok: true; readonly spec: SpecDraft }
  | { readonly ok: true; readonly description: DescriptionDraft }
  | { readonly ok: false; readonly error: string };

export interface DraftingState {
  readonly pending: PendingDraft | null;
  readonly running: boolean;
  /** How many drafts this session has requested — shown in Settings. */
  readonly count: number;
  readonly lastError: string | null;

  /**
   * Ask for a draft. Resolves `null` if the user cancelled the gate, so callers can simply do
   * nothing on cancel.
   */
  request(request: DraftRequest, model: ModelSpec, previewFirst: boolean, env: Readonly<Record<string, string>>): Promise<DraftOutcome | null>;
  /**
   * Show the preview gate for an arbitrary prompt and resolve what the user chose.
   *
   * Exported as a seam so the creator can reuse the ONE gate rather than mounting a second: the
   * "here is exactly what will be sent" promise is a single global contract, and two implementations
   * of it would be two things to keep true. Resolves `false` immediately if a gate is already open.
   */
  gate(prompt: string, model: ModelSpec, previewFirst: boolean): Promise<boolean>;
  confirm(): void;
  cancel(): void;
}

let runner: RunnerClient | null = null;
const client = (): RunnerClient => {
  runner ??= createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" }));
  return runner;
};

/** Resolve the gate for the in-flight request; `null` when the user cancelled. */
let settle: ((go: boolean) => void) | null = null;

const DRAFT_TIMEOUT_MS = 90_000;

/*
 * The same message for both "no structured output at all" and "output missing the fields we need":
 * from the user's seat they are one outcome, and both have the same next move. Sub-1B on-device
 * models miss this schema often enough that the message has to name a bigger model, not just shrug.
 */
const UNUSABLE = "That model didn't return a usable draft. Try again, pick a larger model, or write the agent yourself.";

/** Run a draft program and pull the structured object out of its stream. */
function execute(program: string, env: Readonly<Record<string, string>>, local: boolean): Promise<JsonValue | { error: string }> {
  const c = client();
  return new Promise((resolve) => {
    const unsubscribe = c.subscribe(() => {
      const snap = c.getSnapshot();
      if (snap.status !== "done" && snap.status !== "error") return;
      unsubscribe();
      if (snap.status === "error") {
        resolve({ error: snap.errorHint ?? snap.error ?? "The draft run failed." });
        return;
      }
      // The last object.final is the draft; a small model may emit partials before it.
      const final = [...snap.events].reverse().find((e) => e.type === "object.final");
      if (final === undefined || final.type !== "object.final") {
        resolve({ error: UNUSABLE });
        return;
      }
      resolve(final.value);
    });
    c.run(program, { env, idleTimeoutMs: local ? null : DRAFT_TIMEOUT_MS, timeoutMessage: "Drafting timed out." });
  });
}

const isError = (v: JsonValue | { error: string }): v is { error: string } =>
  typeof v === "object" && v !== null && !Array.isArray(v) && "error" in v && typeof (v as { error: unknown }).error === "string";

export const useDraftingStore = create<DraftingState>()((set, get) => ({
  pending: null,
  running: false,
  count: 0,
  lastError: null,

  async gate(prompt, model, previewFirst) {
    if (!previewFirst) return true;
    if (settle !== null) return false; // a gate is already open — never stack two
    set({ pending: { prompt, model } });
    const go = await new Promise<boolean>((resolve) => {
      settle = resolve;
    });
    settle = null;
    set({ pending: null });
    return go;
  },

  async request(request, model, previewFirst, env) {
    if (get().running) return null; // one draft at a time — they share the worker
    set({ lastError: null });
    if (!(await get().gate(promptFor(request), model, previewFirst))) return null;

    set({ running: true, count: get().count + 1 });
    const raw = await execute(draftProgram(request, model), env, model.kind === "local");
    set({ running: false });

    if (isError(raw)) {
      set({ lastError: raw.error });
      return { ok: false, error: raw.error };
    }
    if (request.kind === "spec") {
      const spec = parseSpecDraft(raw);
      if (spec === null) {
        const error = UNUSABLE;
        set({ lastError: error });
        return { ok: false, error };
      }
      return { ok: true, spec };
    }
    const description = parseDescriptionDraft(raw);
    if (description === null) {
      const error = "The draft came back empty. Try again, or edit the description yourself.";
      set({ lastError: error });
      return { ok: false, error };
    }
    return { ok: true, description };
  },

  confirm() {
    settle?.(true);
  },

  cancel() {
    settle?.(false);
  },
}));
