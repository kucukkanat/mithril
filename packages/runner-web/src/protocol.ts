/*
 * Message protocol between a host UI (main thread) and the runner Web Worker.
 * Everything crossing the boundary is structured-cloneable — MithrilEvents are plain
 * JSON by design, which is exactly why this works.
 */

import type { MithrilEvent } from "@mithril/core/protocol";
import type { ResumeValue } from "@mithril/core/agent";

/** Console levels forwarded from the sandboxed snippet's `console` shim. */
export type LogLevel = "log" | "info" | "warn" | "error";

/**
 * A pending human-in-the-loop suspension, as posted by the worker: the JSON-safe
 * {@link https://mithril.dev/reference/core/ | SuspensionDescriptor}-shaped `request`, the
 * durable-local resume `token`, and the `runId` it belongs to (when the event stream carried one).
 */
export interface SuspendedInfo {
  readonly request: unknown;
  readonly token: string;
  readonly runId?: string;
}

/**
 * A model-download progress report, mirrored from `@mithril/providers/transformers`'s
 * `ProgressReport` (structured-clone safe). Reported for local (in-browser) runs while
 * weights download or load; `progress` is an overall `0..1` fraction across files.
 */
export interface DownloadReport {
  readonly status: string;
  readonly file?: string;
  readonly progress: number;
  readonly loaded: number;
  readonly total: number;
}

/**
 * Resume a previously suspended run from a persisted token instead of starting fresh.
 * When present on a `run` request, the injected `run()` global ignores its `input` and calls
 * `agent.resumeStream(token, decision)` on the reconstructed agent — this is what makes
 * resume-across-page-reload possible: the code re-provides the behavior, the token provides the state.
 */
export interface ResumeDirective {
  readonly token: string;
  readonly decision: ResumeValue;
}

/** UI → worker. */
export type RunnerRequest =
  // `env` seeds `process.env` in the worker so the framework's BYOK fallback (`resolveTransport`)
  // finds the user's key. Only the active provider's single key should ever be sent.
  | {
      readonly type: "run";
      readonly code: string;
      readonly env?: Readonly<Record<string, string>>;
      readonly resume?: ResumeDirective;
    }
  // Answer the pending suspension of the in-flight run (the worker is parked on it).
  | { readonly type: "resume"; readonly decision: ResumeValue };

/** worker → UI. */
export type RunnerMessage =
  | { readonly type: "event"; readonly event: MithrilEvent }
  | { readonly type: "log"; readonly level: LogLevel; readonly text: string }
  | { readonly type: "suspended"; readonly info: SuspendedInfo }
  // Local-model weight download / load progress, outside the event stream.
  | { readonly type: "progress"; readonly report: DownloadReport }
  // The authoritative final RunResult, posted by the injected `run()` (the user's
  // top-level code rarely `return`s it, so we can't rely on the module result).
  | { readonly type: "result"; readonly result: unknown }
  // Generic structured side-channel, produced by the injected `emit(payload)` global —
  // e.g. a harness streaming each result as it completes.
  | { readonly type: "data"; readonly payload: unknown }
  | { readonly type: "done" }
  | { readonly type: "error"; readonly message: string };

/** The lifecycle of one run as seen by a host UI. */
export type RunStatus = "idle" | "running" | "suspended" | "done" | "error";

export type { ResumeValue };
