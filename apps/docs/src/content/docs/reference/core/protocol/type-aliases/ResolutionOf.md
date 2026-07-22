---
editUrl: false
next: false
prev: false
title: "ResolutionOf"
---

```ts
type ResolutionOf<R> = R extends SuspensionRequest<string, JsonValue, infer T> ? T : never;
```

Defined in: [packages/core/src/protocol/suspension.ts:33](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/suspension.ts#L33)

Recover the resolution type of a [SuspensionRequest](/reference/core/protocol/interfaces/suspensionrequest/), or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |
