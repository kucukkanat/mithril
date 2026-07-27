---
editUrl: false
next: false
prev: false
title: "contentToJson"
---

```ts
function contentToJson(content): JsonValue;
```

Defined in: [packages/core/src/protocol/content.ts:79](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/content.ts#L79)

Project content into a JSON-safe value (for the `run.start` event). Assumes sources are already normalized.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | \| `string` \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[] |

## Returns

[`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)
