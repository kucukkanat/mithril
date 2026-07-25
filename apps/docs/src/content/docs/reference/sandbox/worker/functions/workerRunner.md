---
editUrl: false
next: false
prev: false
title: "workerRunner"
---

```ts
function workerRunner(opts?): CodeRunner;
```

Defined in: worker.ts:122

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

## Example

```ts
import { workerRunner } from "@mithril/sandbox/worker";

const runner = workerRunner();
await runner.run("return input.a + input.b", { globals: { input: { a: 1, b: 2 } } }); // value: 3
```
