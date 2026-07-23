---
editUrl: false
next: false
prev: false
title: "ChatRequest"
---

Defined in: [packages/core/src/protocol/provider.ts:57](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L57)

The provider-agnostic semantic input for one model call.

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [packages/core/src/protocol/provider.ts:60](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L60)

***

### model

```ts
readonly model: `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/provider.ts:58](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L58)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/provider.ts:63](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L63)

When set, the caller wants structured output (JSON mode) validated by this schema.

***

### system

```ts
readonly system: string;
```

Defined in: [packages/core/src/protocol/provider.ts:59](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L59)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [packages/core/src/protocol/provider.ts:61](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/provider.ts#L61)
