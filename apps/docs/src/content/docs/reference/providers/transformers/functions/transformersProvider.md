---
editUrl: false
next: false
prev: false
title: "transformersProvider"
---

```ts
function transformersProvider(engine): Provider;
```

Defined in: [transformers/core.ts:65](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/core.ts#L65)

Build a Provider from an injected [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) — the pure, Node-testable core.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `engine` | [`TransformersEngine`](/reference/providers/transformers/interfaces/transformersengine/) | the inference engine (a browser engine for real use, a fake for tests). |

## Returns

`Provider`

a `Provider` whose `chat()` streams `text.delta` (and `reasoning.delta` for models that think),
buffers tool calls and flushes them before a
single terminal `message.end` — the exact ordering of the OpenAI adapter. It ignores `transport`/`rt` and
never performs I/O.

## Example

```ts
import { transformersProvider } from "@mithril/providers/transformers";

const fake = { async *generate() { yield { kind: "token", text: "hi" }; } };
const provider = transformersProvider(fake);
```
