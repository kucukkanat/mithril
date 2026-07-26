/*
 * The probe store — owns executing tool bodies offline and remembering what happened.
 *
 * Unlike a case check, a probe costs nothing: no provider, no key, no network, and it finishes in
 * milliseconds. So it runs on its own, the moment a tool body is worth an opinion — EXCEPT when the body can
 * reach outside the worker. The runner does not sandbox the network, so a body containing `fetch` would
 * really call the API; those wait for an explicit click. See `reachesOutside`.
 *
 * Results are cached by `probeKey` (schema + body), so editing a description or renaming a tool never sends
 * the developer back to a spinner, and re-opening a project shows the verdict immediately.
 *
 * Its own runner client, never the casebook's or the Run view's — a probe must not overwrite the chat you
 * are reading.
 */
import { create } from "zustand";
import { createRunnerClient, type RunnerClient } from "@mithril/runner-web";
import type { ToolSpec } from "@mithril/spec";
import { classifyProbe, probeKey, probeProgram, reachesOutside, type ProbeResult, type SideEffect } from "../lib/probe.ts";

/** A probe body should finish in milliseconds; this only catches a body that never returns. */
const PROBE_TIMEOUT_MS = 10_000;

/** Where one tool stands with the probe. */
export type ProbeEntry =
  | { readonly status: "unprobed" }
  /** The body can reach outside the worker, so running it is the developer's call. */
  | { readonly status: "needs-consent"; readonly effect: SideEffect }
  | { readonly status: "running" }
  | { readonly status: "done"; readonly result: ProbeResult };

const UNPROBED: ProbeEntry = { status: "unprobed" };

export interface ProbeState {
  readonly byKey: Readonly<Record<string, ProbeEntry>>;
  /** Where this tool stands, keyed by its body — never by its name. */
  entry(tool: ToolSpec): ProbeEntry;
  /**
   * Execute the tool body twice, offline. Self-contained bodies run immediately; one that can reach
   * outside the worker returns `needs-consent` until called again with `force`.
   */
  probe(tool: ToolSpec, opts?: { readonly force?: boolean }): Promise<void>;
  /** Probe every tool that can be probed without asking — the sweep on opening a project. */
  probeAll(tools: readonly ToolSpec[]): Promise<void>;
  reset(): void;
}

let runner: RunnerClient | null = null;
const client = (): RunnerClient => {
  runner ??= createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" }));
  return runner;
};

/**
 * Run one probe program to completion and hand back its events.
 *
 * Never rejects: a body that throws is the single most valuable thing a probe can discover, so it must
 * arrive as an observation rather than as a failure of the probe.
 */
function runProbe(code: string): Promise<{ readonly events: readonly import("@mithril/core/protocol").MithrilEvent[]; readonly error: string | null }> {
  const c = client();
  return new Promise((resolve) => {
    const unsubscribe = c.subscribe(() => {
      const snap = c.getSnapshot();
      if (snap.status !== "done" && snap.status !== "error") return;
      unsubscribe();
      resolve({ events: snap.events, error: snap.error });
    });
    c.run(code, { idleTimeoutMs: PROBE_TIMEOUT_MS, timeoutMessage: "The tool did not finish — it may be waiting on something that never arrives." });
  });
}

export const useProbeStore = create<ProbeState>()((set, get) => ({
  byKey: {},

  entry(tool) {
    return get().byKey[probeKey(tool)] ?? UNPROBED;
  },

  async probe(tool, opts) {
    const key = probeKey(tool);
    const current = get().byKey[key];
    if (current?.status === "running") return;
    // A cached verdict for this exact body is still true; only a forced re-run overrides it.
    if (current?.status === "done" && opts?.force !== true) return;

    const effect = reachesOutside(tool.execute.code);
    if (effect !== null && opts?.force !== true) {
      set((s) => ({ byKey: { ...s.byKey, [key]: { status: "needs-consent", effect } } }));
      return;
    }

    set((s) => ({ byKey: { ...s.byKey, [key]: { status: "running" } } }));
    const { events, error } = await runProbe(probeProgram(tool));
    // A program-level failure (a body that does not even parse) is still the body's fault, and the raw
    // message is the evidence — it must not be swallowed into a generic "could not probe".
    const result: ProbeResult =
      events.length === 0 && error !== null
        ? { state: "broken", headline: "broken", detail: `${tool.name} could not run: ${error}`, outputs: [] }
        : classifyProbe(tool, events);
    set((s) => ({ byKey: { ...s.byKey, [key]: { status: "done", result } } }));
  },

  async probeAll(tools) {
    // Sequential: they share one worker, and each takes milliseconds.
    for (const t of tools) await get().probe(t);
  },

  reset() {
    set({ byKey: {} });
  },
}));
