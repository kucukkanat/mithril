---
editUrl: false
next: false
prev: false
title: "createInspector"
---

```ts
function createInspector(opts?): Inspector;
```

Defined in: [packages/devtools/src/index.ts:70](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/index.ts#L70)

Create a headless [Inspector](/reference/devtools/index/interfaces/inspector/) that captures runs from the event stream.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | \{ `maxRuns?`: `number`; \} | `maxRuns` caps retained runs (default 50); the oldest is evicted past the cap. |
| `opts.maxRuns?` | `number` | - |

## Returns

[`Inspector`](/reference/devtools/index/interfaces/inspector/)

an [Inspector](/reference/devtools/index/interfaces/inspector/); attach its `consumer` to an agent.

## Example

```ts
import { createInspector } from "@mithril/devtools";

const inspector = createInspector();
await agent({ model, instructions: "…", use: [{ name: "dev", consumers: [inspector.consumer] }] }).run("hi");
console.log(inspector.latest()?.state.status, inspector.latest()?.timeline);
```
