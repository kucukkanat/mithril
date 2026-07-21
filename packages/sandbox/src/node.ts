import vm from "node:vm";
import type { CodeResult, CodeRunner } from "./index.ts";

// §10.3 `/node` backend. node:vm gives a fresh global scope with a controllable set of globals and a
// synchronous timeout. It is an ISOLATION boundary, NOT a security boundary: determined code can still reach
// out (e.g. via a leaked reference) and the timeout does not bound async work. Use it to run TRUSTED or
// semi-trusted snippets in a clean scope; use remoteRunner for untrusted code.

// A value produced inside the vm context has that context's realm, so `instanceof Promise` (host realm)
// fails — detect a thenable structurally instead.
function isThenable(v: unknown): v is PromiseLike<unknown> {
  return typeof v === "object" && v !== null && typeof (v as { then?: unknown }).then === "function";
}

const NODE_CONSOLE = (logs: string[]): { log: (...a: unknown[]) => void; error: (...a: unknown[]) => void } => ({
  log: (...a: unknown[]): void => {
    logs.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  },
  error: (...a: unknown[]): void => {
    logs.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  },
});

/**
 * Build a {@link CodeRunner} that evaluates code in a fresh `node:vm` context (Node/Bun only).
 *
 * @returns A {@link CodeRunner} that runs each snippet in an isolated scope with a captured `console`.
 * @remarks **Isolation, not security.** The snippet sees only the globals you pass plus a captured `console`;
 * it cannot read the host scope by closure. But `node:vm` is not a sandbox against hostile code, and its
 * `timeout` bounds only synchronous execution — a returned `Promise` is awaited without a deadline. For
 * untrusted code use {@link remoteRunner}. The snippet's last expression (or an explicit `return` inside a
 * wrapper) is the result; a returned `Promise` is awaited.
 * @example
 * ```ts
 * import { nodeVmRunner } from "@mithril/sandbox/node";
 *
 * const runner = nodeVmRunner();
 * const r = await runner.run("const a = 2; a * 21", { timeoutMs: 50 }); // { ok: true, value: 42, logs: [] }
 * ```
 */
export function nodeVmRunner(): CodeRunner {
  return {
    async run(code, opts): Promise<CodeResult> {
      const logs: string[] = [];
      const context = vm.createContext({ console: NODE_CONSOLE(logs), ...(opts?.globals ?? {}) });
      try {
        const raw: unknown = vm.runInContext(code, context, { timeout: opts?.timeoutMs ?? 1000 });
        const value = isThenable(raw) ? await raw : raw;
        return { ok: true, value: value ?? null, logs };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err), logs };
      }
    },
  };
}
