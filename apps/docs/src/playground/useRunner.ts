import { useCallback, useEffect, useRef, useState } from "react";
import type { MithrilEvent } from "@mithril/core/protocol";
import type { ApprovalDecision, DownloadReport, LogLevel, RunnerMessage, RunStatus, SuspendedInfo } from "./protocol.ts";
import type { ProviderMode } from "./providers.ts";

export interface LogLine {
  readonly level: LogLevel;
  readonly text: string;
}

export interface RunnerState {
  readonly status: RunStatus;
  readonly events: readonly MithrilEvent[];
  readonly logs: readonly LogLine[];
  readonly result: unknown;
  readonly error: string | null;
  /** A friendly explanation for common failures (invalid key, CORS, rate limit); raw stays in `error`. */
  readonly errorHint: string | null;
  readonly suspended: SuspendedInfo | null;
  /** Local-model weight download/load progress, when a local run is fetching weights. */
  readonly download: DownloadReport | null;
}

// Scripted runs are pure compute (a runaway loop is the only failure) → a tight 8s guard.
// Live runs hit the network → a generous ceiling. Local runs may download gigabytes with no
// upper bound → no runaway timer at all; the user stops them, and progress shows liveness.
const TIMEOUTS: Readonly<Record<ProviderMode, number | null>> = { scripted: 8000, live: 120_000, local: null };

const INITIAL: RunnerState = {
  status: "idle",
  events: [],
  logs: [],
  result: null,
  error: null,
  errorHint: null,
  suspended: null,
  download: null,
};

/** Map a raw provider/runtime error to a friendly one-liner, or null when nothing specific applies. */
function describeError(raw: string): string | null {
  // A module-load failure (e.g. the local-model runtime) — must be checked before the generic
  // "failed to fetch" below, which its message text would otherwise match.
  if (/dynamically imported module|failed to resolve module|importing a module/i.test(raw))
    return "Couldn't load the local-model runtime. Reload the page and try again.";
  if (/\b40[13]\b|unauthor|invalid.*(api|key)|missing.*key/i.test(raw))
    return "Invalid or missing API key — check the key for this provider in ⚙ Settings.";
  if (/failed to fetch|networkerror|load failed|cors/i.test(raw))
    return "Network or CORS error — this provider may block direct browser calls. Try OpenAI, Anthropic, Google, or Groq, or route through a proxy transport.";
  if (/\b429\b|rate.?limit/i.test(raw)) return "Rate-limited by the provider — wait a moment and retry.";
  if (/\bNO_WASM\b|webassembly|webgpu/i.test(raw)) return "This browser can't run local models (needs WebAssembly / WebGPU).";
  return null;
}

/**
 * Owns the runner Web Worker. A fresh worker is spawned per run so state is clean
 * and a runaway loop can be terminated. Returns the accumulated event stream plus
 * `run` / `resume` / `stop` controls.
 */
export interface RunOpts {
  /** Keys to seed into the worker's `process.env` (Live mode only; active provider's key only). */
  readonly env?: Readonly<Record<string, string>>;
  /** The run mode — selects the runaway-timeout policy. */
  readonly mode?: ProviderMode;
}

export function useRunner() {
  const [state, setState] = useState<RunnerState>(INITIAL);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<ProviderMode>("scripted");

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearTimer();
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  // Arm the runaway-loop guard for the current mode. Local mode (null) has no timer —
  // weight downloads are unbounded, so the user stops them and progress shows liveness.
  const arm = useCallback((message: string) => {
    clearTimer();
    const ms = TIMEOUTS[modeRef.current];
    if (ms === null) return;
    timerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, status: "error", error: message }));
      stop();
    }, ms);
  }, [stop]);

  const run = useCallback(
    (code: string, opts?: RunOpts) => {
      stop();
      modeRef.current = opts?.mode ?? "scripted";
      setState({ ...INITIAL, status: "running" });
      const worker = new Worker(new URL("./runner-worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;

      worker.onmessage = (ev: MessageEvent<RunnerMessage>) => {
        const msg = ev.data;
        switch (msg.type) {
          case "event":
            setState((s) => ({ ...s, events: [...s.events, msg.event] }));
            break;
          case "log":
            setState((s) => ({ ...s, logs: [...s.logs, { level: msg.level, text: msg.text }] }));
            break;
          case "progress":
            setState((s) => ({ ...s, download: msg.report }));
            break;
          case "suspended":
            clearTimer(); // waiting on a human — no runaway timeout
            setState((s) => ({ ...s, status: "suspended", suspended: msg.info }));
            break;
          case "result":
            setState((s) => ({ ...s, result: msg.result }));
            break;
          case "done":
            clearTimer();
            setState((s) => ({ ...s, status: "done", suspended: null }));
            stop();
            break;
          case "error":
            clearTimer();
            setState((s) => ({ ...s, status: "error", error: msg.message, errorHint: describeError(msg.message), suspended: null }));
            stop();
            break;
        }
      };
      worker.onerror = (e) => {
        const message = e.message || "Worker error";
        setState((s) => ({ ...s, status: "error", error: message, errorHint: describeError(message) }));
        stop();
      };

      worker.postMessage({ type: "run", code, env: opts?.env });
      arm(
        modeRef.current === "scripted"
          ? "Run timed out — possible infinite loop."
          : "Run timed out — the provider took too long to respond.",
      );
    },
    [arm, stop],
  );

  const resume = useCallback(
    (decision: ApprovalDecision) => {
      if (!workerRef.current) return;
      setState((s) => ({ ...s, status: "running", suspended: null }));
      workerRef.current.postMessage({ type: "resume", decision });
      arm("Resume timed out.");
    },
    [arm],
  );

  const reset = useCallback(() => {
    stop();
    setState(INITIAL);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { ...state, run, resume, reset };
}
