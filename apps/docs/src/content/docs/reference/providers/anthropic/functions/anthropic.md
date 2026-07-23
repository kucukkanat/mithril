---
editUrl: false
next: false
prev: false
title: "anthropic"
---

```ts
function anthropic(model, opts?): ModelHandle;
```

Defined in: [anthropic/index.ts:135](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/providers/src/anthropic/index.ts#L135)

Self-wiring model handle: `agent({ model: anthropic("claude-sonnet-4"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An Anthropic model id (e.g. `"claude-sonnet-4"`). It is prefixed with `anthropic/` to form the handle id and slashes are stripped before hitting the wire. |
| `opts?` | \{ `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `toolSchema` is a JsonSchemaConverter for tool parameters — supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4 schemas already convert with no converter. |
| `opts.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [anthropicProvider](/reference/providers/anthropic/functions/anthropicprovider/) (or a
  dedicated one when `toolSchema` is given).

## Example

```ts
import { agent } from "mithril";
import { anthropic } from "@mithril/providers/anthropic";

const a = agent({ model: anthropic("claude-sonnet-4"), instructions: "…", tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [anthropicProvider](/reference/providers/anthropic/functions/anthropicprovider/) instead.
