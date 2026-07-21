---
editUrl: false
next: false
prev: false
title: "transformersProvider"
---

```ts
function transformersProvider(engine): Provider;
```

Defined in: transformers/core.ts:63

Build a Provider from an injected [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) — the pure, Node-testable core.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `engine` | [`TransformersEngine`](/reference/providers/transformers/interfaces/transformersengine/) | the inference engine (a browser engine for real use, a fake for tests). |

## Returns

`Provider`

a `Provider` whose `chat()` streams `text.delta`, buffers tool calls and flushes them before a
single terminal `message.end` — the exact ordering of the OpenAI adapter. It ignores `transport`/`rt` and
never performs I/O.

## Example

```ts
import { transformersProvider } from "@mithril/providers/transformers";

const fake = { async *generate() { yield { kind: "token", text: "hi" }; } };
const provider = transformersProvider(fake);
```
