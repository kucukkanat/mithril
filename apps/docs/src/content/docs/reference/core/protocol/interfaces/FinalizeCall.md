---
editUrl: false
next: false
prev: false
title: "FinalizeCall"
---

Defined in: [packages/core/src/protocol/middleware.ts:131](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L131)

The structured-output finalize unit wrapped by a [Middleware.finalize](/mithril/reference/core/protocol/interfaces/middleware/#finalize) handler: the model's final
assistant text plus a schema-shaped `retryHint` a middleware can append when steering a re-ask.

## Properties

### retryHint

```ts
readonly retryHint: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:134](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L134)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/middleware.ts:132](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L132)

***

### text

```ts
readonly text: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:133](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L133)
