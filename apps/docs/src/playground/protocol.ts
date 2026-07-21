// Message protocol between the playground UI (main thread) and the runner Web Worker.
// Everything crossing the boundary is structured-cloneable — MithrilEvents are plain
// JSON by design, which is exactly why this works.

import type { MithrilEvent } from "@mithril/core/protocol";

export type LogLevel = "log" | "info" | "warn" | "error";

export interface SuspendedInfo {
  readonly request: unknown;
  readonly token: string;
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

/** UI → worker. */
export type RunnerRequest =
  // `env` seeds `process.env` in the worker so the framework's BYOK fallback (`resolveTransport`)
  // finds the user's key. Only the active provider's single key is ever sent (see envForRun).
  | { readonly type: "run"; readonly code: string; readonly env?: Readonly<Record<string, string>> }
  | { readonly type: "resume"; readonly decision: ApprovalDecision };

/** worker → UI. */
export type RunnerMessage =
  | { readonly type: "event"; readonly event: MithrilEvent }
  | { readonly type: "log"; readonly level: LogLevel; readonly text: string }
  | { readonly type: "suspended"; readonly info: SuspendedInfo }
  // Local-model weight download / load progress, outside the event stream.
  | { readonly type: "progress"; readonly report: DownloadReport }
  // The authoritative final RunResult, posted by the harness `run()` (the user's
  // top-level code rarely `return`s it, so we can't rely on the module result).
  | { readonly type: "result"; readonly result: unknown }
  | { readonly type: "done" }
  | { readonly type: "error"; readonly message: string };

/** The decision shape the UI sends back for a human-in-the-loop approval. */
export type ApprovalDecision =
  | { readonly kind: "approve" }
  | { readonly kind: "reject"; readonly message: string };

export type RunStatus = "idle" | "running" | "suspended" | "done" | "error";
