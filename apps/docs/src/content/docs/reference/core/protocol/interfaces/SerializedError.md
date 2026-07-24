---
editUrl: false
next: false
prev: false
title: "SerializedError"
---

Defined in: [packages/core/src/protocol/primitives.ts:63](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/primitives.ts#L63)

A JSON-safe serialized form of a thrown error, suitable for the wire.

## Properties

### data?

```ts
readonly optional data?: JsonValue;
```

Defined in: [packages/core/src/protocol/primitives.ts:69](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/primitives.ts#L69)

Optional structured error detail.

***

### message

```ts
readonly message: string;
```

Defined in: [packages/core/src/protocol/primitives.ts:65](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/primitives.ts#L65)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/primitives.ts:64](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/primitives.ts#L64)

***

### retryable?

```ts
readonly optional retryable?: boolean;
```

Defined in: [packages/core/src/protocol/primitives.ts:67](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/primitives.ts#L67)

Whether the operation may be retried; absent means unknown.
