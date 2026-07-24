---
editUrl: false
next: false
prev: false
title: "JsonValue"
---

```ts
type JsonValue = 
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | {
[k: string]: JsonValue;
};
```

Defined in: [packages/core/src/protocol/primitives.ts:12](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/primitives.ts#L12)

Any value that is both JSON-safe and structured-clone-safe.

## Remarks

Excludes functions, class instances, `bigint`, and `Date`. Every value that
crosses the wire — event payloads, tool input/output, suspension payloads —
is one of these.
