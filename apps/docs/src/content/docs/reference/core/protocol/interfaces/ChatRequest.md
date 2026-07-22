---
editUrl: false
next: false
prev: false
title: "ChatRequest"
---

Defined in: [packages/core/src/protocol/provider.ts:44](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L44)

The provider-agnostic semantic input for one model call.

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [packages/core/src/protocol/provider.ts:47](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L47)

***

### model

```ts
readonly model: `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/provider.ts:45](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L45)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/provider.ts:50](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L50)

When set, the caller wants structured output (JSON mode) validated by this schema.

***

### system

```ts
readonly system: string;
```

Defined in: [packages/core/src/protocol/provider.ts:46](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L46)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [packages/core/src/protocol/provider.ts:48](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/provider.ts#L48)
