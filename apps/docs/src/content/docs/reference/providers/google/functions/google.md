---
editUrl: false
next: false
prev: false
title: "google"
---

```ts
function google(model): ModelHandle;
```

Defined in: [google/index.ts:147](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/google/index.ts#L147)

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
