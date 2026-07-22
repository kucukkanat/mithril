---
editUrl: false
next: false
prev: false
title: "ResolutionOf"
---

```ts
type ResolutionOf<R> = R extends SuspensionRequest<string, JsonValue, infer T> ? T : never;
```

Defined in: [packages/core/src/protocol/suspension.ts:33](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/suspension.ts#L33)

Recover the resolution type of a [SuspensionRequest](/reference/core/protocol/interfaces/suspensionrequest/), or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |
