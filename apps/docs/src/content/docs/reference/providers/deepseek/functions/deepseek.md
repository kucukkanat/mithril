---
editUrl: false
next: false
prev: false
title: "deepseek"
---

```ts
function deepseek(model, opts?): ModelHandle;
```

Defined in: deepseek/index.ts:62

Self-wiring model handle: `agent({ model: deepseek("deepseek-chat"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | A DeepSeek model id — `"deepseek-chat"` or `"deepseek-reasoner"`. It is prefixed with `deepseek/` to form the handle id, which is also what selects `DEEPSEEK_API_KEY` for BYOK. |
| `opts?` | \{ `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `toolSchema` is a JsonSchemaConverter for tool parameters — supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4 schemas already convert with no converter. |
| `opts.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [deepseekProvider](/mithril/reference/providers/deepseek/functions/deepseekprovider/) (or a
  dedicated one when `toolSchema` is given).

## Example

```ts
import { agent } from "mithril";
import { deepseek } from "@mithril/providers/deepseek";

// Reads DEEPSEEK_API_KEY from the environment when no transport is passed.
const a = agent({ model: deepseek("deepseek-chat"), instructions: "…", tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [deepseekProvider](/mithril/reference/providers/deepseek/functions/deepseekprovider/) instead.
