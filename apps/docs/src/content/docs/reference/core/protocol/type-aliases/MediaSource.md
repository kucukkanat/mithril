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

Defined in: packages/core/src/protocol/content.ts:55

A media source resolved for a provider body: an external URL, or inline base64 with its media type.
