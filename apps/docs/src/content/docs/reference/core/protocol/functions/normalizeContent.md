---
editUrl: false
next: false
prev: false
title: "normalizeContent"
---

```ts
function normalizeContent(content): 
  | string
  | readonly ContentPart[];
```

Defined in: [packages/core/src/protocol/content.ts:50](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/content.ts#L50)

Normalize a message's content: a string passes through; parts are each [normalizeContentPart](/mithril/reference/core/protocol/functions/normalizecontentpart/)-ed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | \| `string` \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[] |

## Returns

  \| `string`
  \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[]
