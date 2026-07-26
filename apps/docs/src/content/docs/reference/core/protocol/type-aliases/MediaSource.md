---
editUrl: false
next: false
prev: false
title: "MediaSource"
---

```ts
type MediaSource = 
  | {
  kind: "url";
  url: string;
}
  | {
  data: string;
  kind: "base64";
  mediaType: string;
};
```

Defined in: [packages/core/src/protocol/content.ts:55](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/content.ts#L55)

A media source resolved for a provider body: an external URL, or inline base64 with its media type.
