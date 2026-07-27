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

Defined in: [packages/core/src/protocol/content.ts:50](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/content.ts#L50)

Normalize a message's content: a string passes through; parts are each [normalizeContentPart](/mithril/reference/core/protocol/functions/normalizecontentpart/)-ed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | \| `string` \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[] |

## Returns

  \| `string`
  \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[]
