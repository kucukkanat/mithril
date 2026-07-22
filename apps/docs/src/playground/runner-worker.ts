/// <reference lib="webworker" />
/*
 * The playground runner. Runs entirely in a Web Worker so a runaway loop can be
 * terminated and user code never blocks the UI. It transpiles the user's
 * TypeScript with sucrase, injects the REAL @mithril/* modules through a `require`
 * shim, and drives `agent.stream()` — forwarding every MithrilEvent to the UI.
 *
 * Scripted mode is the default (zero network, model turns from the scripted provider).
 * In Live mode the UI seeds `process.env.<PROVIDER>_API_KEY` (see the `run` handler) so
 * the framework's BYOK fallback reaches a real provider; in Local mode `transformers`
 * runs a model on-device and streams weight-download progress back to the UI.
 */
import { transform } from "sucrase";
import * as coreAgent from "@mithril/core/agent";
import * as coreProtocol from "@mithril/core/protocol";
import * as testkit from "@mithril/core/testkit";
import * as evals from "@mithril/evals";
import * as memory from "@mithril/memory";
import * as kv from "@mithril/kv";
import * as fs from "@mithril/fs";
import * as vectors from "@mithril/vectors";
import * as workflows from "@mithril/workflows";
import * as otel from "@mithril/otel";
import * as mithrilMeta from "mithril";
import { anthropic } from "mithril/anthropic";
import { openai, openaiProvider } from "mithril/openai";
import { google } from "@mithril/providers/google";
import { transformers as transformersRaw, DEFAULT_MODEL } from "mithril/transformers";
import { z } from "zod";
import type { MithrilEvent } from "@mithril/core/protocol";
import type { ApprovalDecision, RunnerMessage, RunnerRequest } from "./protocol.ts";

const post = (m: RunnerMessage): void => {
  (self as unknown as { postMessage(message: unknown): void }).postMessage(m);
};

// Wrap the local handle so weight-download/load progress rides our progress channel —
// the user snippet stays a plain `transformers("…")` with no onProgress plumbing.
const transformers: typeof transformersRaw = (model, opts) =>
  transformersRaw(model, { ...opts, onProgress: (report) => post({ type: "progress", report }) });

// The exact set of modules a playground snippet may import. Everything is the
// real package — the same code that ships to npm.
const MODULES: Readonly<Record<string, unknown>> = {
  mithril: mithrilMeta,
  "mithril/anthropic": { anthropic },
  "mithril/openai": { openai, openaiProvider },
  "mithril/transformers": { transformers, DEFAULT_MODEL },
  "@mithril/providers/google": { google },
  "@mithril/core/agent": coreAgent,
  "@mithril/core/protocol": coreProtocol,
  "@mithril/core/testkit": testkit,
  "@mithril/evals": evals,
  "@mithril/memory": memory,
  "@mithril/kv": kv,
  "@mithril/fs": fs,
  "@mithril/vectors": vectors,
  "@mithril/workflows": workflows,
  "@mithril/otel": otel,
  zod: { z },
};

function playgroundRequire(spec: string): unknown {
  const mod = MODULES[spec];
  if (mod === undefined) {
    throw new Error(
      `Cannot import "${spec}" in the playground. Available modules: ${Object.keys(MODULES).join(", ")}.`,
    );
  }
  return mod;
}

// A default usage delta, injected as `usage`, so scripted turns stay terse.
const usage = { input: 8, output: 24, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 600 } as const;

let resumeWaiter: ((decision: ApprovalDecision) => void) | null = null;

interface RunHandleLike {
  readonly events: AsyncIterable<MithrilEvent>;
  result(): Promise<{ readonly status: string; readonly request?: unknown; readonly token?: string }>;
}
interface AgentLike {
  stream(input: unknown, opts?: unknown): RunHandleLike;
  resume(token: string, decision: ApprovalDecision): Promise<{ readonly status: string; readonly token?: string; readonly request?: unknown }>;
}

async function drive(handle: RunHandleLike): Promise<{ readonly status: string; readonly request?: unknown; readonly token?: string }> {
  for await (const event of handle.events) post({ type: "event", event });
  return handle.result();
}

/**
 * Injected as the global `run(agent, input)`. Streams the agent, forwarding its
 * MithrilEvent stream to the inspector, and cooperatively handles suspension:
 * it posts the approval request and waits for the UI's decision before resuming.
 */
function toJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

async function run(agentInstance: AgentLike, input: unknown, opts?: unknown): Promise<unknown> {
  let result = await drive(agentInstance.stream(input, opts));
  let guard = 0;
  while (result.status === "suspended" && typeof result.token === "string" && guard < 8) {
    guard++;
    post({ type: "suspended", info: { request: result.request, token: result.token } });
    const decision = await new Promise<ApprovalDecision>((resolve) => {
      resumeWaiter = resolve;
    });
    result = await agentInstance.resume(result.token, decision);
  }
  // Authoritative: the UI can't recover this from the (frozen-at-suspend) event log.
  post({ type: "result", result: toJson(result) });
  return result;
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
const consoleShim = {
  log: (...a: unknown[]) => post({ type: "log", level: "log", text: a.map(stringify).join(" ") }),
  info: (...a: unknown[]) => post({ type: "log", level: "info", text: a.map(stringify).join(" ") }),
  warn: (...a: unknown[]) => post({ type: "log", level: "warn", text: a.map(stringify).join(" ") }),
  error: (...a: unknown[]) => post({ type: "log", level: "error", text: a.map(stringify).join(" ") }),
  debug: (...a: unknown[]) => post({ type: "log", level: "log", text: a.map(stringify).join(" ") }),
};

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

async function execute(code: string): Promise<void> {
  const compiled = transform(code, {
    transforms: ["typescript", "imports"],
    preserveDynamicImport: false,
  }).code;
  const exports: Record<string, unknown> = {};
  const moduleObj = { exports };
  const fn = new AsyncFunction("require", "exports", "module", "run", "usage", "console", compiled);
  await fn(playgroundRequire, exports, moduleObj, run, usage, consoleShim);
  post({ type: "done" });
}

self.addEventListener("message", (ev: MessageEvent<RunnerRequest>) => {
  const msg = ev.data;
  if (msg.type === "resume") {
    resumeWaiter?.(msg.decision);
    resumeWaiter = null;
    return;
  }
  if (msg.type === "run") {
    // Seed process.env so the framework's BYOK fallback (resolveTransport) finds the key.
    // The UI sends only the active provider's single key; a fresh worker per run means no teardown.
    if (msg.env !== undefined) {
      const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
      g.process = { env: { ...(g.process?.env ?? {}), ...msg.env } };
    }
    execute(msg.code).catch((err: unknown) => {
      post({ type: "error", message: err instanceof Error ? err.message : String(err) });
    });
  }
});
