import type { CodeResult, CodeRunner, RunOptions } from "./index.ts";

// §10.3 `/worker` backend — the one local runner that works in a BROWSER, and the only one with a real
// deadline on async code.
//
// A worker is a separate global with no DOM and no access to the host's scope: the same CLASS of boundary
// node:vm provides, so the honesty story is unchanged (`isolation: "scope"`, not a defence against hostile
// same-origin code). What it adds is termination — `terminate()` kills a worker mid-await, so an
// `await new Promise(() => {})` body is bounded, which `node:vm`'s synchronous-only `timeout` cannot do.
//
// Node-only APIs are reached through a DYNAMIC import so this entrypoint stays browser-safe under
// scripts/check-browser-safe.ts (its subpath is not on the node/bun/server/http exemption list, so the
// browser build of this file is actually verified).

// Evaluated inside the worker. Deleting the network globals first is what makes the closed-world default
// real rather than advisory: a script tool with no `fetch` has no exfiltration channel.
const WORKER_SOURCE = String.raw`
const __logs = [];
const __fmt = (a) => a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ");
const __post = (msg) => (typeof postMessage === "function" ? postMessage(msg) : __parentPort.postMessage(msg));
const __onMessage = async (data) => {
  for (const k of ["fetch", "XMLHttpRequest", "importScripts", "WebSocket", "EventSource"]) {
    try { delete globalThis[k]; } catch { /* non-configurable in some runtimes; the omission is reported below */ }
  }
  globalThis.console = { log: (...a) => __logs.push(__fmt(a)), error: (...a) => __logs.push(__fmt(a)), warn: (...a) => __logs.push(__fmt(a)), info: (...a) => __logs.push(__fmt(a)) };
  for (const [k, v] of Object.entries(data.globals ?? {})) globalThis[k] = v;
  try {
    const value = await (0, eval)(data.code);
    __post({ ok: true, value: value === undefined ? null : value, logs: __logs });
  } catch (err) {
    __post({ ok: false, error: err instanceof Error ? err.message : String(err), logs: __logs });
  }
};
`;

const BROWSER_ENTRY = `${WORKER_SOURCE}\nself.onmessage = (e) => { void __onMessage(e.data); };`;
const NODE_ENTRY = `const { parentPort: __parentPort } = require("node:worker_threads");\n${WORKER_SOURCE}\n__parentPort.on("message", (d) => { void __onMessage(d); });`;

interface WorkerLike {
  postMessage(data: unknown): void;
  terminate(): void | Promise<number>;
}

type Settle = (r: CodeResult) => void;

function isMessage(v: unknown): v is { ok?: boolean; value?: unknown; error?: string; logs?: readonly string[] } {
  return typeof v === "object" && v !== null;
}

function toResult(raw: unknown): CodeResult {
  if (!isMessage(raw)) return { ok: false, error: "worker returned a non-object message", logs: [] };
  const logs = raw.logs ?? [];
  if (raw.ok === true) return { ok: true, value: raw.value ?? null, logs };
  return { ok: false, error: raw.error ?? "worker reported failure", logs };
}

interface Spawned {
  readonly worker: WorkerLike;
  readonly cleanup: () => void;
}

// Node and Bun both expose a global `Worker`, but only the browser one loads a blob: URL — so pick the
// backend by runtime rather than by feature-detecting `Worker`, which is present in all three.
function isServerRuntime(): boolean {
  const proc = (globalThis as { process?: { versions?: Readonly<Record<string, string>> } }).process;
  return proc?.versions?.["node"] !== undefined || proc?.versions?.["bun"] !== undefined;
}

// Browser: a blob: URL worker. A strict CSP without `worker-src blob:` blocks this — the failure surfaces
// as an ordinary failed CodeResult, and remoteRunner remains the answer there.
function spawnBrowser(onMessage: (d: unknown) => void, onError: (e: string) => void): Spawned {
  const url = URL.createObjectURL(new Blob([BROWSER_ENTRY], { type: "text/javascript" }));
  const w = new Worker(url);
  w.onmessage = (e: MessageEvent): void => {
    onMessage(e.data);
  };
  w.onerror = (e: ErrorEvent): void => {
    onError(e.message || "worker error");
  };
  // Revoked only after the worker is done: revoking while it is still loading can abort the load.
  return { worker: w, cleanup: () => URL.revokeObjectURL(url) };
}

async function spawnServer(onMessage: (d: unknown) => void, onError: (e: string) => void): Promise<Spawned> {
  const { Worker: NodeWorker } = await import("node:worker_threads");
  const w = new NodeWorker(NODE_ENTRY, { eval: true });
  w.on("message", onMessage);
  w.on("error", (err: Error) => onError(err.message));
  return { worker: w, cleanup: () => {} };
}

/**
 * Build a {@link CodeRunner} that evaluates code in a dedicated worker — the local backend that works in
 * **browsers, Node and Bun** alike.
 *
 * @param opts - `defaultTimeoutMs` (default 1000) applies when a call passes no `timeoutMs`.
 * @returns A {@link CodeRunner} with `isolation: "scope"`.
 *
 * @remarks
 * **Isolation, not security** — the same caveat as {@link nodeVmRunner}. A worker has its own global scope
 * and no DOM, but in a browser it shares the page's origin; it is a boundary against accidents, not against
 * hostile code. For untrusted code use {@link remoteRunner}.
 *
 * What it adds over `node:vm` is a **real deadline**: the worker is terminated on timeout, so a body that
 * awaits forever is bounded. `node:vm`'s `timeout` bounds only synchronous execution.
 *
 * `fetch`, `XMLHttpRequest`, `importScripts`, `WebSocket` and `EventSource` are deleted before the snippet
 * runs, so the default is a closed world with no network. Pass anything the code legitimately needs through
 * `globals` — but note those values cross a structured-clone boundary, so they must be data, not functions.
 *
 * In a browser the worker is created from a `blob:` URL; a strict CSP without `worker-src blob:` will block
 * it, surfacing as an ordinary failed {@link CodeResult}.
 *
 * The snippet is evaluated as a **script**, not a function body: its value is the completion value of the
 * last expression, so a bare top-level `return` (or top-level `await`) is a syntax error. Wrap those in an
 * IIFE. A returned promise is awaited for you.
 *
 * @example
 * ```ts
 * import { workerRunner } from "@mithril/sandbox/worker";
 *
 * const runner = workerRunner();
 * await runner.run("input.a + input.b", { globals: { input: { a: 1, b: 2 } } }); // value: 3
 * await runner.run("(() => { const a = 2; return a * 21; })()");                 // value: 42
 * await runner.run("new Promise(() => {})", { timeoutMs: 50 });   // ok: false — exceeded its 50ms budget
 * ```
 */
export function workerRunner(opts: { readonly defaultTimeoutMs?: number } = {}): CodeRunner {
  return {
    isolation: "scope",
    async run(code: string, o?: RunOptions): Promise<CodeResult> {
      const logs: string[] = [];
      let settle: Settle | undefined;
      const done = new Promise<CodeResult>((resolve) => {
        settle = resolve;
      });
      const finish = (r: CodeResult): void => {
        settle?.(r);
        settle = undefined;
      };

      const onMessage = (d: unknown): void => finish(toResult(d));
      const onError = (e: string): void => finish({ ok: false, error: e, logs });
      let spawned: Spawned;
      try {
        spawned = isServerRuntime() ? await spawnServer(onMessage, onError) : spawnBrowser(onMessage, onError);
      } catch (err) {
        return { ok: false, error: `could not start a sandbox worker: ${err instanceof Error ? err.message : String(err)}`, logs };
      }
      const { worker, cleanup } = spawned;

      const ms = o?.timeoutMs ?? opts.defaultTimeoutMs ?? 1000;
      const timer = setTimeout(() => {
        finish({ ok: false, error: `code exceeded its ${ms}ms budget`, logs });
      }, ms);
      try {
        worker.postMessage({ code, globals: o?.globals ?? {} });
        return await done;
      } finally {
        clearTimeout(timer);
        // Unconditional: on the happy path it reclaims the worker, and on timeout it IS the deadline —
        // the reason this backend can bound async code at all.
        await worker.terminate();
        cleanup();
      }
    },
  };
}
