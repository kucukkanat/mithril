/// <reference lib="webworker" />
/*
 * The worker half of the runner. A host app owns a tiny worker entry file:
 *
 * ```ts
 * import { installRunner } from "@mithril/runner-web/worker";
 * installRunner(self as unknown as DedicatedWorkerGlobalScope);
 * ```
 *
 * so its bundler sees a plain `new Worker(new URL("./worker-entry.ts", import.meta.url))` and
 * bundles this module (plus the whole framework registry) into the worker chunk. Running in a
 * worker means a runaway loop can be terminated and user code never blocks the UI.
 *
 * The runner transpiles the snippet's TypeScript with sucrase, resolves its imports against the
 * module registry (the REAL packages), and injects the harness globals: `run(agent, input, opts?)`
 * drives `agent.stream()` forwarding every MithrilEvent to the host, `emit(payload)` is a generic
 * structured side-channel, `usage` is a default UsageDelta for scripted turns, and `console` is
 * forwarded as log messages.
 */
import { transform } from "sucrase";
import type { MithrilEvent } from "@mithril/core/protocol";
import type { ResumeValue } from "@mithril/core/agent";
import { defaultModules } from "./modules.ts";
import type { ResumeDirective, RunnerMessage, RunnerRequest } from "./protocol.ts";

/** Options for {@link installRunner}. */
export interface InstallRunnerOptions {
  /**
   * Extra modules to expose to snippets (or overrides of the defaults). Keys are import
   * specifiers, values the evaluated module namespaces — merged over {@link defaultModules}.
   */
  readonly extraModules?: Readonly<Record<string, unknown>>;
}

interface RunHandleLike {
  readonly events: AsyncIterable<MithrilEvent>;
  result(): Promise<RunResultLike>;
}
interface RunResultLike {
  readonly status: string;
  readonly request?: unknown;
  readonly token?: string;
}
interface AgentLike {
  stream(input: unknown, opts?: unknown): RunHandleLike;
  resume(token: string, decision: ResumeValue): Promise<RunResultLike>;
  resumeStream?(token: string, decision: ResumeValue): RunHandleLike;
}

// A default usage delta, injected as `usage`, so scripted turns stay terse.
const USAGE = { input: 8, output: 24, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 600 } as const;

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

function toJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Wire the runner protocol onto a dedicated worker scope: listens for {@link RunnerRequest}
 * messages, executes snippets, and posts {@link RunnerMessage}s back. Call once from the host
 * app's worker entry file.
 */
export function installRunner(scope: DedicatedWorkerGlobalScope, opts?: InstallRunnerOptions): void {
  const post = (m: RunnerMessage): void => scope.postMessage(m);

  const modules: Readonly<Record<string, unknown>> = {
    ...defaultModules({ onProgress: (report) => post({ type: "progress", report }) }),
    ...opts?.extraModules,
  };

  function runnerRequire(spec: string): unknown {
    const mod = modules[spec];
    if (mod === undefined) {
      throw new Error(`Cannot import "${spec}" in the runner. Available modules: ${Object.keys(modules).join(", ")}.`);
    }
    return mod;
  }

  let resumeWaiter: ((decision: ResumeValue) => void) | null = null;
  // Set by a `run` request carrying a ResumeDirective; consumed by the injected run()'s first call.
  let pendingResume: ResumeDirective | null = null;
  // The latest runId seen on the event stream — attached to suspension info so hosts can checkpoint.
  let lastRunId: string | undefined;

  async function drive(handle: RunHandleLike): Promise<RunResultLike> {
    for await (const event of handle.events) {
      lastRunId = event.runId ?? lastRunId;
      post({ type: "event", event });
    }
    return handle.result();
  }

  /**
   * Injected as the global `run(agent, input, opts?)`. Streams the agent, forwarding its
   * MithrilEvent stream to the host, and cooperatively handles suspension: it posts the
   * request and waits for the host's decision before resuming. When the run request carried
   * a ResumeDirective, the first call resumes from that token instead of starting fresh.
   */
  async function run(agentInstance: AgentLike, input: unknown, runOpts?: unknown): Promise<unknown> {
    const directive = pendingResume;
    pendingResume = null;
    let result: RunResultLike;
    if (directive !== null) {
      result =
        agentInstance.resumeStream !== undefined
          ? await drive(agentInstance.resumeStream(directive.token, directive.decision))
          : await agentInstance.resume(directive.token, directive.decision);
    } else {
      result = await drive(agentInstance.stream(input, runOpts));
    }
    let guard = 0;
    while (result.status === "suspended" && typeof result.token === "string" && guard < 8) {
      guard++;
      post({ type: "suspended", info: { request: result.request, token: result.token, ...(lastRunId === undefined ? {} : { runId: lastRunId }) } });
      const decision = await new Promise<ResumeValue>((resolve) => {
        resumeWaiter = resolve;
      });
      result =
        agentInstance.resumeStream !== undefined
          ? await drive(agentInstance.resumeStream(result.token, decision))
          : await agentInstance.resume(result.token, decision);
    }
    // Authoritative: the host can't recover this from the (frozen-at-suspend) event log.
    post({ type: "result", result: toJson(result) });
    return result;
  }

  /** Injected as the global `emit(payload)` — a generic structured side-channel to the host. */
  const emit = (payload: unknown): void => post({ type: "data", payload: toJson(payload) });

  const consoleShim = {
    log: (...a: unknown[]) => post({ type: "log", level: "log", text: a.map(stringify).join(" ") }),
    info: (...a: unknown[]) => post({ type: "log", level: "info", text: a.map(stringify).join(" ") }),
    warn: (...a: unknown[]) => post({ type: "log", level: "warn", text: a.map(stringify).join(" ") }),
    error: (...a: unknown[]) => post({ type: "log", level: "error", text: a.map(stringify).join(" ") }),
    debug: (...a: unknown[]) => post({ type: "log", level: "log", text: a.map(stringify).join(" ") }),
  };

  async function execute(code: string): Promise<void> {
    const compiled = transform(code, {
      transforms: ["typescript", "imports"],
      preserveDynamicImport: false,
    }).code;
    const exports: Record<string, unknown> = {};
    const moduleObj = { exports };
    const fn = new AsyncFunction("require", "exports", "module", "run", "emit", "usage", "console", compiled);
    await fn(runnerRequire, exports, moduleObj, run, emit, USAGE, consoleShim);
    post({ type: "done" });
  }

  scope.addEventListener("message", (ev: MessageEvent<RunnerRequest>) => {
    const msg = ev.data;
    if (msg.type === "resume") {
      resumeWaiter?.(msg.decision);
      resumeWaiter = null;
      return;
    }
    if (msg.type === "run") {
      // Seed process.env so the framework's BYOK fallback (resolveTransport) finds the key.
      // The host sends only the active provider's single key; a fresh worker per run means no teardown.
      if (msg.env !== undefined) {
        const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
        g.process = { env: { ...(g.process?.env ?? {}), ...msg.env } };
      }
      pendingResume = msg.resume ?? null;
      execute(msg.code).catch((err: unknown) => {
        post({ type: "error", message: err instanceof Error ? err.message : String(err) });
      });
    }
  });
}
