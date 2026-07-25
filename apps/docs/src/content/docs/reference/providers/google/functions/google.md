---
editUrl: false
next: false
prev: false
title: "google"
---

```ts
function google(model): ModelHandle;
```

Defined in: [google/index.ts:161](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/providers/src/google/index.ts#L161)

Self-wiring model handle: `agent({ model: google("gemini-1.5-pro"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | A Gemini model id (e.g. `"gemini-1.5-pro"`). It is prefixed with `google/` to form the handle id and slashes are stripped before hitting the wire. |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [googleProvider](/mithril/reference/providers/google/functions/googleprovider/).

## Example

```ts
import { agent } from "@mithril/core";
import { google } from "@mithril/providers/google";

const a = agent({ model: google("gemini-1.5-pro"), tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [googleProvider](/mithril/reference/providers/google/functions/googleprovider/) instead.
