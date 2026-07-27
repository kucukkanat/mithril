# @mithril/sandbox

Runtime-agnostic **code execution** seam — a `CodeRunner` interface with an *honest-degradation* family of
backends. No runtime can run untrusted code with equal safety everywhere, so this package makes the tradeoff
explicit and asks you to choose the backend:

| Backend | Import | Safety | Where |
| --- | --- | --- | --- |
| `nodeVmRunner()` | `@mithril/sandbox/node` | **Isolation, not security** (`node:vm`) | Node, Bun |
| `workerRunner()` | `@mithril/sandbox/worker` | **Isolation, not security** (worker scope) — but a *real* deadline on async code | Browsers, Node, Bun |
| `remoteRunner()` | `@mithril/sandbox` | Delegated to a trusted service | Everywhere |

`nodeVmRunner` and `workerRunner` both report `isolation: "scope"`; `remoteRunner` reports `isolation:
"remote"`. A WASM backend (QuickJS / Pyodide) with a stronger in-process boundary is on the roadmap.

## Usage

### `nodeVmRunner` — isolated scope (trusted / semi-trusted code)

```ts
import { nodeVmRunner } from "@mithril/sandbox/node";

const runner = nodeVmRunner();

const r = await runner.run("const a = 2; a * 21", { timeoutMs: 50 });
// → { ok: true, value: 42, logs: [] }

// inject inputs as globals; the host scope is NOT visible to the snippet
await runner.run("input.x + 1", { globals: { input: { x: 41 } } }); // → { ok: true, value: 42 }
await runner.run("typeof process"); // → { ok: true, value: "undefined" }
```

> **Isolation, not security.** `node:vm` gives the snippet a fresh global scope (it can't read your closure),
> but it is **not** a sandbox against hostile code, and its `timeout` bounds only *synchronous* execution — a
> returned `Promise` is awaited without a deadline. For untrusted code, use `remoteRunner`.

### `workerRunner` — the browser-capable backend, with a real async deadline

```ts
import { workerRunner } from "@mithril/sandbox/worker";

const runner = workerRunner();

await runner.run("input.a + input.b", { globals: { input: { a: 1, b: 2 } } });
// → { ok: true, value: 3, logs: [] }

// unlike node:vm's synchronous-only timeout, a hung promise is genuinely bounded
await runner.run("new Promise(() => {})", { timeoutMs: 50 });
// → { ok: false, error: "code exceeded its 50ms budget", logs: [] }
```

The snippet is evaluated as a **script**: its value is the completion value of the last expression, and a
returned promise is awaited for you. A bare top-level `return` or `await` is a syntax error — wrap those in
an IIFE:

```ts
await runner.run("(() => { const a = 2; return a * 21; })()"); // → { ok: true, value: 42, logs: [] }
await runner.run("Promise.resolve(7)");                        // → { ok: true, value: 7,  logs: [] }
```

The snippet runs in a fresh worker — a separate global with no DOM and no view of the host's scope. Two
properties the other local backend doesn't have:

- **A real deadline.** `terminate()` kills a worker mid-`await`, so a hung promise is bounded. Default
  budget is **1000 ms**, overridable per call (`timeoutMs`) or per runner (`workerRunner({ defaultTimeoutMs })`).
- **Closed-world by default.** `fetch`, `XMLHttpRequest`, `importScripts`, `WebSocket`, and `EventSource`
  are deleted inside the worker before the snippet runs, so a script tool has no exfiltration channel.

It runs on **browsers, Node, and Bun** — Node-only APIs are reached through a dynamic import, so the
entrypoint stays browser-safe. In a browser the worker is created from a `blob:` URL, so a strict CSP
without `worker-src blob:` blocks it; that surfaces as an ordinary failed `CodeResult`, not a throw.

> **Still isolation, not security.** A worker is the same *class* of boundary as `node:vm` — it stops a
> snippet reading your closure, not a determined same-origin attacker. For untrusted code, use `remoteRunner`.

### `remoteRunner` — proxy to a trusted sandbox service (untrusted code)

```ts
import { remoteRunner } from "@mithril/sandbox";

const runner = remoteRunner({
  endpoint: "https://sandbox.example.com/run",
  headers: { authorization: `Bearer ${token}` },
});

const r = await runner.run("return heavyComputation()");
```

The endpoint receives `POST { code, timeoutMs, globals }` and replies with `{ ok, value?, error?, logs? }`.
The host never evaluates the code, so safety is the service's responsibility. Inject `fetch` for testing.

## API

- `remoteRunner({ endpoint, fetch?, headers? }): CodeRunner`
- `nodeVmRunner(): CodeRunner` (from `@mithril/sandbox/node`)
- `workerRunner({ defaultTimeoutMs? }): CodeRunner` (from `@mithril/sandbox/worker`)
- Types: `CodeRunner`, `CodeResult`, `RunOptions`.
