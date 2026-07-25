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

Defined in: packages/core/src/protocol/content.ts:50

Normalize a message's content: a string passes through; parts are each [normalizeContentPart](/mithril/reference/core/protocol/functions/normalizecontentpart/)-ed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | \| `string` \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[] |

## Returns

  \| `string`
  \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[]
