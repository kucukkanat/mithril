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

Defined in: [packages/core/src/protocol/content.ts:55](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/content.ts#L55)

A media source resolved for a provider body: an external URL, or inline base64 with its media type.
