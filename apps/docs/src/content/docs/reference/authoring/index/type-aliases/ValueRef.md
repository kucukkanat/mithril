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

Defined in: compose.ts:16

A value a composition step can pass: the tool's own input, an earlier step's output, or a literal.
