---
editUrl: false
next: false
prev: false
title: "toolAuthoring"
---

```ts
function toolAuthoring(opts?): Plugin<unknown>;
```

Defined in: [index.ts:161](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/index.ts#L161)

The tool-authoring plugin: adds `define_tool`, `list_tools` and `revoke_tool`, and teaches the loop how
to rebuild authored tools when a suspended run resumes.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`AuthoringOptions`](/mithril/reference/authoring/index/interfaces/authoringoptions/) | see [AuthoringOptions](/mithril/reference/authoring/index/interfaces/authoringoptions/). |

## Returns

`Plugin`\<`unknown`\>

a Plugin for an agent's `use` array.

## Example

```ts
import { agent } from "@mithril/core/agent";
import { toolAuthoring } from "@mithril/authoring";

const a = agent({
  model: "anthropic/claude-sonnet-5",
  instructions: "Build the tools you need from the ones you have.",
  tools: [getWeather, cToF],
  use: [toolAuthoring()],
});
```
