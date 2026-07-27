---
editUrl: false
next: false
prev: false
title: "openrouter"
---

```ts
function openrouter(model, opts?): ModelHandle;
```

Defined in: openrouter/index.ts:83

Self-wiring model handle: `agent({ model: openrouter("anthropic/claude-sonnet-4.5"), … })` needs no
provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An OpenRouter model id, itself `vendor/model` (e.g. `"anthropic/claude-sonnet-4.5"`, `"deepseek/deepseek-chat"`, `"meta-llama/llama-3.3-70b-instruct"`). It is prefixed with `openrouter/` to form the handle id, which is also what selects `OPENROUTER_API_KEY` for BYOK; only that first segment is stripped on the wire, so the vendor-qualified id reaches OpenRouter intact. |
| `opts?` | \{ `toolSchema?`: `JsonSchemaConverter`; \} & [`OpenRouterAttribution`](/mithril/reference/providers/openrouter/interfaces/openrouterattribution/) | Optional overrides. `toolSchema` is a JsonSchemaConverter for tool parameters — supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4 schemas already convert with no converter. `appUrl` / `appName` are optional [OpenRouterAttribution](/mithril/reference/providers/openrouter/interfaces/openrouterattribution/). |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [openrouterProvider](/mithril/reference/providers/openrouter/functions/openrouterprovider/) (or a
  dedicated one when any option is given).

## Example

```ts
import { agent } from "mithril";
import { openrouter } from "@mithril/providers/openrouter";

// Reads OPENROUTER_API_KEY from the environment when no transport is passed.
const a = agent({ model: openrouter("anthropic/claude-sonnet-4.5"), instructions: "…", tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [openrouterProvider](/mithril/reference/providers/openrouter/functions/openrouterprovider/) instead.
