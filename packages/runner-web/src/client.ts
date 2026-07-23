/*
 * The main-thread half of the runner: a framework-free state machine that owns the worker
 * lifecycle. A fresh worker is spawned per run so state is clean and a runaway loop can be
 * terminated; an idle watchdog (reset by every worker message) replaces a wall-clock timeout so
 * long-but-alive runs — big eval suites, slow local generation — are never killed while streaming.
 *
 * `subscribe`/`getSnapshot` match `useSyncExternalStore`'s contract, so a React host wraps a
 * client in one line; non-React hosts poll or subscribe directly.
 */

import type { MithrilEvent } from "@mithril/core/protocol";
import type { DownloadReport, LogLevel, ResumeDirective, ResumeValue, RunnerMessage, RunStatus, SuspendedInfo } from "./protocol.ts";

/** One forwarded `console.*` line from the snippet. */
export interface LogLine {
  readonly level: LogLevel;
  readonly text: string;
}

/** The accumulated state of the current (or last) run. */
export interface RunnerSnapshot {
  readonly status: RunStatus;
  readonly events: readonly MithrilEvent[];
  readonly logs: readonly LogLine[];
  /** The authoritative final RunResult posted by the injected `run()` (JSON-safe), or `null`. */
  readonly result: unknown;
  readonly error: string | null;
  /** A friendly explanation for common failures (invalid key, CORS, rate limit); raw stays in `error`. */
  readonly errorHint: string | null;
  readonly suspended: SuspendedInfo | null;
  /** Local-model weight download/load progress, when a local run is fetching weights. */
  readonly download: DownloadReport | null;
  /** Payloads received on the `emit()` side-channel, in arrival order. */
  readonly data: readonly unknown[];
}

/** Options for one {@link RunnerClient.run} call. */
export interface RunnerRunOptions {
  /** Keys to seed into the worker's `process.env` (the active provider's key only). */
  readonly env?: Readonly<Record<string, string>>;
  /**
   * Kill the run after this many ms with NO worker message (idle watchdog). `null` disables the
   * watchdog entirely (e.g. unbounded local-model weight downloads). Default: 120 000.
   */
  readonly idleTimeoutMs?: number | null;
  /** The error message shown when the watchdog fires. */
  readonly timeoutMessage?: string;
  /** Resume a persisted suspension instead of starting fresh (see {@link ResumeDirective}). */
  readonly resume?: ResumeDirective;
}

/** Owns the runner worker and exposes the run's accumulated state. */
export interface RunnerClient {
  /** Subscribe to snapshot changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  getSnapshot(): RunnerSnapshot;
  /** Terminate any in-flight run, then execute `code` in a fresh worker. */
  run(code: string, opts?: RunnerRunOptions): void;
  /** Answer the pending suspension of the in-flight run. */
  resume(decision: ResumeValue): void;
  /**
   * Terminate the in-flight run. Accumulated `events`/`logs` are kept, but `status` returns to `"idle"`
   * so subscribers leave the running state (a run already at `"done"`/`"error"` is untouched).
   */
  stop(): void;
  /** Terminate and clear back to the idle snapshot. */
  reset(): void;
}

/** The pristine snapshot a client starts from (and returns to on {@link RunnerClient.reset}). */
export const IDLE_RUNNER_SNAPSHOT: RunnerSnapshot = {
  status: "idle",
  events: [],
  logs: [],
  result: null,
  error: null,
  errorHint: null,
  suspended: null,
  download: null,
  data: [],
};

const DEFAULT_IDLE_TIMEOUT_MS = 120_000;

/** Map a raw provider/runtime error to a friendly one-liner, or `null` when nothing specific applies. */
export function describeRunnerError(raw: string): string | null {
  // A module-load failure (e.g. the local-model runtime) — must be checked before the generic
  // "failed to fetch" below, which its message text would otherwise match.
  if (/dynamically imported module|failed to resolve module|importing a module/i.test(raw))
    return "Couldn't load the local-model runtime. Reload the page and try again.";
  if (/\b40[13]\b|unauthor|invalid.*(api|key)|missing.*key/i.test(raw))
    return "Invalid or missing API key — check the key for this provider.";
  if (/failed to fetch|networkerror|load failed|cors/i.test(raw))
    return "Network or CORS error — this provider may block direct browser calls. Try OpenAI, Anthropic, Google, or Groq, or route through a proxy transport.";
  if (/\b429\b|rate.?limit/i.test(raw)) return "Rate-limited by the provider — wait a moment and retry.";
  if (/\bNO_WASM\b|webassembly|webgpu/i.test(raw)) return "This browser can't run local models (needs WebAssembly / WebGPU).";
  return null;
}

/**
 * Create a {@link RunnerClient} over a worker factory. The factory must return a module worker
 * whose entry calls `installRunner` (from `@mithril/runner-web/worker`) — each run spawns a fresh
 * one so terminate is always a safe kill switch.
 *
 * @example
 * ```ts
 * const client = createRunnerClient(
 *   () => new Worker(new URL("./worker-entry.ts", import.meta.url), { type: "module" }),
 * );
 * client.subscribe(() => render(client.getSnapshot()));
 * client.run(code, { env: { OPENAI_API_KEY: key } });
 * ```
 */
export function createRunnerClient(spawn: () => Worker): RunnerClient {
  let snapshot = IDLE_RUNNER_SNAPSHOT;
  let worker: Worker | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let watchdog: { readonly ms: number; readonly message: string } | null = null;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<RunnerSnapshot>): void => {
    snapshot = { ...snapshot, ...patch };
    for (const l of listeners) l();
  };

  const clearTimer = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  // Tear down the worker + watchdog WITHOUT touching the snapshot status. The internal terminate; the
  // public `stop()` (below) adds the status transition a user-initiated stop needs.
  const terminate = (): void => {
    clearTimer();
    watchdog = null;
    worker?.terminate();
    worker = null;
  };

  // (Re)arm the idle watchdog: every worker message proves liveness and pushes the deadline out.
  const kick = (): void => {
    clearTimer();
    if (watchdog === null) return;
    const { ms, message } = watchdog;
    timer = setTimeout(() => {
      set({ status: "error", error: message, errorHint: describeRunnerError(message) });
      terminate();
    }, ms);
  };

  const onMessage = (msg: RunnerMessage): void => {
    kick();
    switch (msg.type) {
      case "event":
        set({ events: [...snapshot.events, msg.event] });
        break;
      case "log":
        set({ logs: [...snapshot.logs, { level: msg.level, text: msg.text }] });
        break;
      case "progress":
        set({ download: msg.report });
        break;
      case "data":
        set({ data: [...snapshot.data, msg.payload] });
        break;
      case "suspended":
        clearTimer(); // waiting on a human — no watchdog
        set({ status: "suspended", suspended: msg.info });
        break;
      case "result":
        set({ result: msg.result });
        break;
      case "done":
        clearTimer();
        set({ status: "done", suspended: null });
        terminate();
        break;
      case "error":
        clearTimer();
        set({ status: "error", error: msg.message, errorHint: describeRunnerError(msg.message), suspended: null });
        terminate();
        break;
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    run(code, opts) {
      terminate();
      snapshot = { ...IDLE_RUNNER_SNAPSHOT, status: "running" };
      for (const l of listeners) l();
      const idle = opts?.idleTimeoutMs === undefined ? DEFAULT_IDLE_TIMEOUT_MS : opts.idleTimeoutMs;
      watchdog =
        idle === null
          ? null
          : { ms: idle, message: opts?.timeoutMessage ?? "Run timed out — no activity from the runner." };
      const w = spawn();
      worker = w;
      w.onmessage = (ev: MessageEvent<RunnerMessage>) => onMessage(ev.data);
      w.onerror = (e) => {
        const message = e.message || "Worker error";
        set({ status: "error", error: message, errorHint: describeRunnerError(message) });
        terminate();
      };
      w.postMessage({ type: "run", code, env: opts?.env, resume: opts?.resume });
      kick();
    },
    resume(decision) {
      if (worker === null) return;
      set({ status: "running", suspended: null });
      worker.postMessage({ type: "resume", decision });
      kick();
    },
    stop() {
      // A user-initiated stop of an in-flight run must publish a terminal status, or subscribers stay
      // stuck in the running state (the composer never leaves "Stop"). Accumulated events/logs are kept.
      const wasActive = snapshot.status === "running" || snapshot.status === "suspended";
      terminate();
      if (wasActive) set({ status: "idle", suspended: null, download: null });
    },
    reset() {
      terminate();
      set(IDLE_RUNNER_SNAPSHOT);
    },
  };
}
