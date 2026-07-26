---
editUrl: false
next: false
prev: false
title: "ContentPart"
---

```ts
type ContentPart = 
  | {
  text: string;
  type: "text";
}
  | {
  image: string | Uint8Array;
  mediaType?: string;
  type: "image";
}
  | {
  data: string | Uint8Array;
  filename?: string;
  mediaType: string;
  type: "file";
};
```

Defined in: [packages/core/src/protocol/content.ts:13](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/content.ts#L13)

One part of a multimodal message. `image`/`file` sources may be a URL (`https:`/`data:`), a bare base64
string (with `mediaType`), or raw bytes (`Uint8Array`) — all normalized to a `data:`/URL string for storage
and transport via [normalizeContent](/mithril/reference/core/protocol/functions/normalizecontent/).
