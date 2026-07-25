---
editUrl: false
next: false
prev: false
title: "anthropic"
---

```ts
function anthropic(model, opts?): ModelHandle;
```

Defined in: [anthropic/index.ts:150](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/anthropic/index.ts#L150)

Self-wiring model handle: `agent({ model: anthropic("claude-sonnet-4"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An Anthropic model id (e.g. `"claude-sonnet-4"`). It is prefixed with `anthropic/` to form the handle id and slashes are stripped before hitting the wire. |
| `opts?` | \{ `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `toolSchema` is a JsonSchemaConverter for tool parameters — supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4 schemas already convert with no converter. |
| `opts.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [anthropicProvider](/mithril/reference/providers/anthropic/functions/anthropicprovider/) (or a
  dedicated one when `toolSchema` is given).

## Example

```ts
import { agent } from "mithril";
import { anthropic } from "@mithril/providers/anthropic";

const a = agent({ model: anthropic("claude-sonnet-4"), instructions: "…", tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [anthropicProvider](/mithril/reference/providers/anthropic/functions/anthropicprovider/) instead.
