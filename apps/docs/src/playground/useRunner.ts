import { useMemo, useSyncExternalStore, useEffect } from "react";
import { createRunnerClient, type RunnerSnapshot } from "@mithril/runner-web";
import type { ApprovalDecision } from "./protocol.ts";
import type { ProviderMode } from "./providers.ts";

/*
 * Thin React wrapper over @mithril/runner-web's client state machine. The client owns the
 * worker lifecycle (fresh worker per run, terminate as kill switch, idle watchdog); this hook
 * only maps it onto React state and the playground's mode→timeout policy.
 */

// Scripted runs are pure compute (a runaway loop is the only failure) → a tight 8s idle guard.
// Live runs hit the network → a generous ceiling. Local runs may download gigabytes with no
// upper bound → no watchdog at all; the user stops them, and progress shows liveness.
const TIMEOUTS: Readonly<Record<ProviderMode, number | null>> = { scripted: 8000, live: 120_000, local: null };

export interface RunOpts {
  /** Keys to seed into the worker's `process.env` (Live mode only; active provider's key only). */
  readonly env?: Readonly<Record<string, string>>;
  /** The run mode — selects the runaway-timeout policy. */
  readonly mode?: ProviderMode;
}

export type { RunnerSnapshot as RunnerState };
export type { LogLine } from "@mithril/runner-web";

export function useRunner() {
  const client = useMemo(
    () =>
      createRunnerClient(
        () => new Worker(new URL("./runner-worker.ts", import.meta.url), { type: "module" }),
      ),
    [],
  );
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  useEffect(() => () => client.stop(), [client]);

  return {
    ...state,
    run: (code: string, opts?: RunOpts) => {
      const mode = opts?.mode ?? "scripted";
      client.run(code, {
        env: opts?.env,
        idleTimeoutMs: TIMEOUTS[mode],
        timeoutMessage:
          mode === "scripted"
            ? "Run timed out — possible infinite loop."
            : "Run timed out — the provider took too long to respond.",
      });
    },
    resume: (decision: ApprovalDecision) => client.resume(decision),
    reset: () => client.reset(),
  };
}
