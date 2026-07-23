---
editUrl: false
next: false
prev: false
title: "defineDevtoolsElements"
---

```ts
function defineDevtoolsElements(options?): void;
```

Defined in: [packages/devtools/src/element.ts:133](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/devtools/src/element.ts#L133)

Register the devtools custom elements. Call once before using the tags.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | \{ `prefix?`: `string`; \} | `prefix` (default `"mithril"`) → `<mithril-run-inspector>` / `<mithril-devtools-panel>`. |
| `options.prefix?` | `string` | - |

## Returns

`void`

## Remarks

Idempotent — safe to call more than once. No-op on the server (guards on `customElements`).

## Example

```ts
import { defineDevtoolsElements } from "@mithril/devtools/element";
import "@mithril/devtools/ui.css";

defineDevtoolsElements();
const el = document.createElement("mithril-run-inspector");
el.source = agent.stream("hi");
document.body.append(el);
```
