---
editUrl: false
next: false
prev: false
title: "openai"
---

```ts
function openai(model): ModelHandle;
```

Defined in: openai/index.ts:101

Self-wiring model handle: `agent({ model: openai("gpt-4o"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An OpenAI model id (e.g. `"gpt-4o"`). It is prefixed with `openai/` to form the handle id. |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [openaiProvider](/reference/providers/openai/functions/openaiprovider/).

## Example

```ts
import { agent } from "@mithril/core";
import { openai } from "@mithril/providers/openai";

const a = agent({ model: openai("gpt-4o"), tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [openaiProvider](/reference/providers/openai/functions/openaiprovider/) instead.
