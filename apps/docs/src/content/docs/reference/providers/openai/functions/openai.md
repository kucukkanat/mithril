---
editUrl: false
next: false
prev: false
title: "openai"
---

```ts
function openai(model, opts?): ModelHandle;
```

Defined in: [openai/index.ts:112](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/openai/index.ts#L112)

Self-wiring model handle: `agent({ model: openai("gpt-4o"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An OpenAI model id (e.g. `"gpt-4o"`). It is prefixed with `openai/` to form the handle id. |
| `opts?` | \{ `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `toolSchema` is a JsonSchemaConverter for tool parameters — supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4 schemas already convert with no converter. |
| `opts.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [openaiProvider](/reference/providers/openai/functions/openaiprovider/) (or a
  dedicated one when `toolSchema` is given).

## Example

```ts
import { agent } from "mithril";
import { openai } from "@mithril/providers/openai";

const a = agent({ model: openai("gpt-4o"), instructions: "…", tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [openaiProvider](/reference/providers/openai/functions/openaiprovider/) instead.
