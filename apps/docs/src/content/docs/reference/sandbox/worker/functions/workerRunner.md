---
editUrl: false
next: false
prev: false
title: "workerRunner"
---

```ts
function workerRunner(opts?): CodeRunner;
```

Defined in: [worker.ts:128](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/sandbox/src/worker.ts#L128)

Build a [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) that evaluates code in a dedicated worker — the local backend that works in
**browsers, Node and Bun** alike.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `defaultTimeoutMs?`: `number`; \} | `defaultTimeoutMs` (default 1000) applies when a call passes no `timeoutMs`. |
| `opts.defaultTimeoutMs?` | `number` | - |

## Returns

[`CodeRunner`](/mithril/reference/sandbox/index/interfaces/coderunner/)

A [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) with `isolation: "scope"`.

## Remarks

**Isolation, not security** — the same caveat as nodeVmRunner. A worker has its own global scope
and no DOM, but in a browser it shares the page's origin; it is a boundary against accidents, not against
hostile code. For untrusted code use remoteRunner.

What it adds over `node:vm` is a **real deadline**: the worker is terminated on timeout, so a body that
awaits forever is bounded. `node:vm`'s `timeout` bounds only synchronous execution.

`fetch`, `XMLHttpRequest`, `importScripts`, `WebSocket` and `EventSource` are deleted before the snippet
runs, so the default is a closed world with no network. Pass anything the code legitimately needs through
`globals` — but note those values cross a structured-clone boundary, so they must be data, not functions.

In a browser the worker is created from a `blob:` URL; a strict CSP without `worker-src blob:` will block
it, surfacing as an ordinary failed [CodeResult](/mithril/reference/sandbox/index/type-aliases/coderesult/).

The snippet is evaluated as a **script**, not a function body: its value is the completion value of the
last expression, so a bare top-level `return` (or top-level `await`) is a syntax error. Wrap those in an
IIFE. A returned promise is awaited for you.

## Example

```ts
import { workerRunner } from "@mithril/sandbox/worker";

const runner = workerRunner();
await runner.run("input.a + input.b", { globals: { input: { a: 1, b: 2 } } }); // value: 3
await runner.run("(() => { const a = 2; return a * 21; })()");                 // value: 42
await runner.run("new Promise(() => {})", { timeoutMs: 50 });   // ok: false — exceeded its 50ms budget
```
