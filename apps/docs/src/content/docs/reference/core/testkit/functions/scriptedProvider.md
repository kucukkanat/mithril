---
editUrl: false
next: false
prev: false
title: "scriptedProvider"
---

```ts
function scriptedProvider(turns): Provider;
```

Defined in: [packages/core/src/testkit/index.ts:103](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/testkit/index.ts#L103)

Build a deterministic [Provider](/reference/core/protocol/interfaces/provider/) that replays a fixed script of provider chunks.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `turns` | readonly readonly [`ProviderChunk`](/reference/core/protocol/type-aliases/providerchunk/)[][] | one array of [ProviderChunk](/reference/core/protocol/type-aliases/providerchunk/)s per model turn; the Nth `chat()` call yields the Nth turn (an exhausted script yields an empty turn). |

## Returns

[`Provider`](/reference/core/protocol/interfaces/provider/)

a `Provider` whose `spec` advertises a single `test/x` model and never touches the network.

## Remarks

Turn state is per-provider and mutates across `chat()` calls, so use a fresh provider per test.

## Example

```ts
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { agent } from "@mithril/core/agent";

const provider = scriptedProvider([
  [
    { type: "text.delta", delta: "Hi there" },
    { type: "message.end", finishReason: "stop", usage: ZERO_DELTA },
  ],
]);
const result = await agent({ model: testModel(provider), instructions: "…" }).run("hello");
```
