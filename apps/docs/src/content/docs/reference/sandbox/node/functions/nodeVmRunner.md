---
editUrl: false
next: false
prev: false
title: "nodeVmRunner"
---

```ts
function nodeVmRunner(): CodeRunner;
```

Defined in: [node.ts:41](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/sandbox/src/node.ts#L41)

Build a [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) that evaluates code in a fresh `node:vm` context (Node/Bun only).

## Returns

[`CodeRunner`](/mithril/reference/sandbox/index/interfaces/coderunner/)

A [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) that runs each snippet in an isolated scope with a captured `console`.

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
