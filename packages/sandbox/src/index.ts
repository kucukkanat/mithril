/**
 * Runtime-agnostic code-execution seam for Mithril — the {@link CodeRunner} interface and an honest-degradation
 * family of backends.
 *
 * @packageDocumentation
 */

// §10.3 — CodeRunner is an honest-degradation adapter: no runtime can run untrusted code with equal safety
// everywhere. `/node` isolates via node:vm (a scope boundary, NOT a security boundary); `/remote` proxies to
// a trusted sandbox service (the secure option). A WASM backend (QuickJS/Pyodide) that runs IN the browser is
// on the roadmap. Backends live behind explicit per-runtime subpaths — never auto-detected.

/** The outcome of a {@link CodeRunner.run}: the returned value (on success) or an error, plus captured logs. */
export type CodeResult =
  | { readonly ok: true; readonly value: unknown; readonly logs: readonly string[] }
  | { readonly ok: false; readonly error: string; readonly logs: readonly string[] };

/** Options for a single {@link CodeRunner.run}. */
export interface RunOptions {
  /** Wall-clock budget for synchronous execution, in milliseconds (default 1000). */
  readonly timeoutMs?: number;
  /** Extra values injected as globals into the execution scope (e.g. inputs the code may read). */
  readonly globals?: Readonly<Record<string, unknown>>;
}

/**
 * A runtime-agnostic seam for running a snippet of code and capturing its result and logs.
 *
 * @remarks
 * An honest-degradation adapter (§10.3): the security guarantee depends on the backend. {@link nodeVmRunner}
 * isolates scope but is **not** a security boundary against hostile code; {@link remoteRunner} delegates to a
 * trusted sandbox service. Choose the backend explicitly — this package never auto-detects one.
 */
export interface CodeRunner {
  run(code: string, opts?: RunOptions): Promise<CodeResult>;
}

/**
 * Build a {@link CodeRunner} that proxies execution to a trusted remote sandbox service (the secure option).
 *
 * @param opts - `endpoint` receives `POST { code, timeoutMs, globals }` and must reply with
 *   `{ ok, value?, error?, logs? }`. `fetch` injects the fetcher (default the global `fetch`); `headers`
 *   are sent with every request (e.g. auth).
 * @returns A {@link CodeRunner} whose safety is the remote service's responsibility.
 * @remarks This is the recommended backend for untrusted code: the browser/Node host never evaluates it.
 * @example
 * ```ts
 * const runner = remoteRunner({ endpoint: "https://sandbox.example.com/run", headers: { authorization: token } });
 * const r = await runner.run("return 1 + 1");
 * ```
 */
export function remoteRunner(opts: {
  readonly endpoint: string;
  readonly fetch?: typeof fetch;
  readonly headers?: Readonly<Record<string, string>>;
}): CodeRunner {
  const doFetch = opts.fetch ?? fetch;
  return {
    async run(code, o): Promise<CodeResult> {
      const res = await doFetch(opts.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", ...opts.headers },
        body: JSON.stringify({ code, timeoutMs: o?.timeoutMs, globals: o?.globals }),
      });
      if (!res.ok) return { ok: false, error: `sandbox HTTP ${res.status}`, logs: [] };
      const data = (await res.json()) as { ok?: boolean; value?: unknown; error?: string; logs?: readonly string[] };
      const logs = data.logs ?? [];
      if (data.ok === true) return { ok: true, value: data.value ?? null, logs };
      return { ok: false, error: data.error ?? "remote sandbox reported failure", logs };
    },
  };
}
