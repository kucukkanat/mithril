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

Defined in: [compose.ts:16](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L16)

A value a composition step can pass: the tool's own input, an earlier step's output, or a literal.
