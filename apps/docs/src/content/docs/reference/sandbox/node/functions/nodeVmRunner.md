---
editUrl: false
next: false
prev: false
title: "nodeVmRunner"
---

```ts
function nodeVmRunner(): CodeRunner;
```

Defined in: [node.ts:41](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/sandbox/src/node.ts#L41)

Build a [CodeRunner](/reference/sandbox/index/interfaces/coderunner/) that evaluates code in a fresh `node:vm` context (Node/Bun only).

## Returns

[`CodeRunner`](/reference/sandbox/index/interfaces/coderunner/)

A [CodeRunner](/reference/sandbox/index/interfaces/coderunner/) that runs each snippet in an isolated scope with a captured `console`.

## Remarks

**Isolation, not security.** The snippet sees only the globals you pass plus a captured `console`;
it cannot read the host scope by closure. But `node:vm` is not a sandbox against hostile code, and its
`timeout` bounds only synchronous execution — a returned `Promise` is awaited without a deadline. For
untrusted code use remoteRunner. The snippet's last expression (or an explicit `return` inside a
wrapper) is the result; a returned `Promise` is awaited.

## Example

```ts
import { nodeVmRunner } from "@mithril/sandbox/node";

const runner = nodeVmRunner();
const r = await runner.run("const a = 2; a * 21", { timeoutMs: 50 }); // { ok: true, value: 42, logs: [] }
```
