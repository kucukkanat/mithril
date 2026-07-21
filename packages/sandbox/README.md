# @mithril/sandbox

Runtime-agnostic **code execution** seam — a `CodeRunner` interface with an *honest-degradation* family of
backends. No runtime can run untrusted code with equal safety everywhere, so this package makes the tradeoff
explicit and asks you to choose the backend:

| Backend | Import | Safety | Where |
| --- | --- | --- | --- |
| `nodeVmRunner()` | `@mithril/sandbox/node` | **Isolation, not security** (`node:vm`) | Node, Bun |
| `remoteRunner()` | `@mithril/sandbox` | Delegated to a trusted service | Everywhere |

A WASM backend (QuickJS / Pyodide) that runs *in* the browser is on the roadmap.

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
- Types: `CodeRunner`, `CodeResult`, `RunOptions`.
