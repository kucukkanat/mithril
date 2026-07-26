---
editUrl: false
next: false
prev: false
title: "contentToText"
---

```ts
function contentToText(content): string;
```

Defined in: [packages/core/src/protocol/content.ts:73](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/content.ts#L73)

Flatten content to plain text (for logging / the reducer's string-only [Message](/mithril/reference/core/protocol/interfaces/message/)).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | \| `string` \| readonly [`ContentPart`](/mithril/reference/core/protocol/type-aliases/contentpart/)[] |

## Returns

`string`
