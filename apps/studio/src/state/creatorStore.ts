/*
 * Build orchestration for the agent that creates agents.
 *
 * Its own runner client, separate from drafting's and the casebook's, for the reason the casebook
 * store already gives: a build takes tens of seconds, and a description-fix started in another tab
 * must never terminate it (`RunnerClient.run` terminates the previous worker).
 *
 * The preview gate is NOT duplicated — it borrows `draftingStore.gate`, so there is exactly one
 * implementation of "here is what will be sent" in the app.
 *
 * Three phases live in one screen rather than three routes: the project does not exist until Accept,
 * so there is no id to route to, and a route swap would throw away the prompt on back-navigation.
 */
import { create } from "zustand";
import { createRunnerClient, type DownloadReport, type RunnerClient } from "@mithril/runner-web";
import type { MithrilEvent } from "@mithril/core/protocol";
import type { ModelSpec, ProjectSpec } from "@mithril/spec";
import {
  creatorProgram,
  creatorPromptFor,
  creatorToSpec,
  parseCreatorEvents,
  specSummary,
  type BuildNote,
  type BuildResult,
  type CreatorEvent,
  type CreatorRequest,
} from "../lib/creator.ts";
import { useDraftingStore } from "./draftingStore.ts";

export type BuildPhase = "idle" | "building" | "review";

/** What a finished (or abandoned) build produced. */
export interface BuildOutcome {
  readonly spec: ProjectSpec;
  readonly notes: readonly BuildNote[];
  readonly summary: string | null;
  /** The run ended without `finish` — stopped, failed, or out of steps. */
  readonly stoppedEarly: boolean;
  /** Why it ended badly, when it did. */
  readonly error: string | null;
}

export interface CreatorState {
  readonly phase: BuildPhase;
  /** Definitions emitted so far, in order — the live build log AND the build record. */
  readonly events: readonly CreatorEvent[];
  readonly outcome: BuildOutcome | null;
  /** Weight-download progress for on-device models; without it the first build looks frozen. */
  readonly download: DownloadReport | null;
  readonly running: boolean;

  /** Resolves once the build has settled into `review` (or back to `idle` if the gate was cancelled). */
  start(request: CreatorRequest, model: ModelSpec, previewFirst: boolean, env: Readonly<Record<string, string>>): Promise<void>;
  /**
   * Run an edit against an existing project and resolve the CANDIDATE spec — nothing is applied.
   *
   * Separate from {@link CreatorState.start} because it must not touch the homepage's phases: the
   * Designer shows a change plan instead of a review card, and the caller decides whether to apply.
   * Resolves `null` if the gate was cancelled or a run is already in flight.
   */
  edit(
    instruction: string,
    base: ProjectSpec,
    model: ModelSpec,
    previewFirst: boolean,
    env: Readonly<Record<string, string>>,
  ): Promise<{ readonly result: BuildResult; readonly error: string | null } | null>;
  /** Stop an in-flight build and keep whatever it already made. */
  stop(): void;
  reset(): void;
}

let runner: RunnerClient | null = null;
const client = (): RunnerClient => {
  runner ??= createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" }));
  return runner;
};

/*
 * An IDLE timeout, reset by every worker message (client.kick), so a long-but-alive build is never
 * killed mid-stream — only genuine silence trips it. `null` for local models preserves the
 * weight-download exemption drafting established: a first on-device run is quiet for minutes.
 */
const BUILD_IDLE_MS = 180_000;

/*
 * A run that dies mid-stream (a provider fault, a bad model id) ends the SNIPPET normally — the
 * injected `run()` returns and the worker reports `done` — so the failure exists only as a
 * `run.error` event. Reading it here is what stops a broken run from being reported as a clean build
 * with nothing in it, blamed on the model "answering in prose".
 */
function runFailure(events: readonly MithrilEvent[]): string | null {
  const failed = events.find((e) => e.type === "run.error");
  return failed !== undefined && failed.type === "run.error" ? failed.error.message : null;
}

export const useCreatorStore = create<CreatorState>()((set, get) => ({
  phase: "idle",
  events: [],
  outcome: null,
  download: null,
  running: false,

  async start(request, model, previewFirst, env) {
    if (get().running) return;
    if (!(await useDraftingStore.getState().gate(creatorPromptFor(request), model, previewFirst))) return;

    const c = client();
    set({ phase: "building", events: [], outcome: null, download: null, running: true });

    await new Promise<void>((resolve) => {
      const unsubscribe = c.subscribe(() => {
        const snap = c.getSnapshot();
        // Definitions stream in as they are made, so the screen shows work rather than a spinner.
        set({ events: parseCreatorEvents(snap.data), download: snap.download ?? null });
        if (snap.status !== "done" && snap.status !== "error") return;
        unsubscribe();

        const events = parseCreatorEvents(snap.data);
        const job = request.kind === "create" ? request.job : request.instruction;
        const built = creatorToSpec(events, model, job);
        set({
          phase: "review",
          events,
          running: false,
          outcome: {
            ...built,
            stoppedEarly: !built.finished,
            error: snap.status === "error" ? (snap.errorHint ?? snap.error ?? "The build failed.") : runFailure(snap.events),
          },
        });
        resolve();
      });
      c.run(creatorProgram(request, model), {
        env,
        idleTimeoutMs: model.kind === "local" ? null : BUILD_IDLE_MS,
        timeoutMessage: "The build went quiet for three minutes.",
      });
    });
  },

  async edit(instruction, base, model, previewFirst, env) {
    if (get().running) return null;
    const request: CreatorRequest = { kind: "edit", instruction, summary: specSummary(base) };
    if (!(await useDraftingStore.getState().gate(creatorPromptFor(request), model, previewFirst))) return null;

    const c = client();
    set({ running: true, events: [], download: null });

    return new Promise((resolve) => {
      const unsubscribe = c.subscribe(() => {
        const snap = c.getSnapshot();
        set({ events: parseCreatorEvents(snap.data), download: snap.download ?? null });
        if (snap.status !== "done" && snap.status !== "error") return;
        unsubscribe();
        set({ running: false });
        resolve({
          result: creatorToSpec(parseCreatorEvents(snap.data), model, instruction, base),
          error: snap.status === "error" ? (snap.errorHint ?? snap.error ?? "The edit failed.") : runFailure(snap.events),
        });
      });
      c.run(creatorProgram(request, model), {
        env,
        idleTimeoutMs: model.kind === "local" ? null : BUILD_IDLE_MS,
        timeoutMessage: "The edit went quiet for three minutes.",
      });
    });
  },

  stop() {
    // terminate() resolves the subscription above through a `done`/`error` snapshot, so whatever was
    // already emitted still becomes a reviewable build. Stopping is a salvage path, not a discard.
    client().stop();
  },

  reset() {
    set({ phase: "idle", events: [], outcome: null, download: null, running: false });
  },
}));
