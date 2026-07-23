---
editUrl: false
next: false
prev: false
title: "FinalizeCall"
---

Defined in: [packages/core/src/protocol/middleware.ts:130](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L130)

The structured-output finalize unit wrapped by a [Middleware.finalize](/reference/core/protocol/interfaces/middleware/#finalize) handler: the model's final
assistant text plus a schema-shaped `retryHint` a middleware can append when steering a re-ask.

## Properties

### retryHint

```ts
readonly retryHint: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:133](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L133)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/middleware.ts:131](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L131)

***

### text

```ts
readonly text: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:132](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L132)
