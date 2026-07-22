---
editUrl: false
next: false
prev: false
title: "google"
---

```ts
function google(model): ModelHandle;
```

Defined in: [google/index.ts:147](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/google/index.ts#L147)

Self-wiring model handle: `agent({ model: google("gemini-1.5-pro"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | A Gemini model id (e.g. `"gemini-1.5-pro"`). It is prefixed with `google/` to form the handle id and slashes are stripped before hitting the wire. |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [googleProvider](/reference/providers/google/functions/googleprovider/).

## Example

```ts
import { agent } from "@mithril/core";
import { google } from "@mithril/providers/google";

const a = agent({ model: google("gemini-1.5-pro"), tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [googleProvider](/reference/providers/google/functions/googleprovider/) instead.
