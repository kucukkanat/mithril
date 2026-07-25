---
editUrl: false
next: false
prev: false
title: "ResolutionOf"
---

```ts
type ResolutionOf<R> = R extends SuspensionRequest<string, JsonValue, infer T> ? T : never;
```

Defined in: [packages/core/src/protocol/suspension.ts:33](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L33)

Recover the resolution type of a [SuspensionRequest](/mithril/reference/core/protocol/interfaces/suspensionrequest/), or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |
