---
editUrl: false
next: false
prev: false
title: "ValueRef"
---

```ts
type ValueRef = 
  | {
  from: "input";
  path?: string;
}
  | {
  from: "step";
  id: string;
  path?: string;
}
  | {
  value: JsonValue;
};
```

Defined in: [compose.ts:16](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/compose.ts#L16)

A value a composition step can pass: the tool's own input, an earlier step's output, or a literal.
