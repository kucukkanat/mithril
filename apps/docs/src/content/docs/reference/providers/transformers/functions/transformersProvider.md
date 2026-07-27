---
editUrl: false
next: false
prev: false
title: "transformersProvider"
---

```ts
function transformersProvider(engine): Provider;
```

Defined in: [transformers/core.ts:66](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L66)

Build a Provider from an injected [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) — the pure, Node-testable core.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `engine` | [`TransformersEngine`](/mithril/reference/providers/transformers/interfaces/transformersengine/) | the inference engine (a browser engine for real use, a fake for tests). |

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
