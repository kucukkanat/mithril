---
editUrl: false
next: false
prev: false
title: "anthropic"
---

```ts
function anthropic(model): ModelHandle;
```

Defined in: anthropic/index.ts:124

Self-wiring model handle: `agent({ model: anthropic("claude-sonnet-4"), … })` needs no provider registry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | An Anthropic model id (e.g. `"claude-sonnet-4"`). It is prefixed with `anthropic/` to form the handle id and slashes are stripped before hitting the wire. |

## Returns

`ModelHandle`

A ModelHandle bound to a shared default-configured [anthropicProvider](/reference/providers/anthropic/functions/anthropicprovider/).

## Example

```ts
import { agent } from "@mithril/core";
import { anthropic } from "@mithril/providers/anthropic";

const a = agent({ model: anthropic("claude-sonnet-4"), tools: [] });
```

## Remarks

Need a custom `baseUrl`? Build a provider with [anthropicProvider](/reference/providers/anthropic/functions/anthropicprovider/) instead.
