---
editUrl: false
next: false
prev: false
title: "ChatRequest"
---

Defined in: [packages/core/src/protocol/provider.ts:57](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L57)

The provider-agnostic semantic input for one model call.

## Properties

### messages

```ts
readonly messages: readonly ModelMessage[];
```

Defined in: [packages/core/src/protocol/provider.ts:60](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L60)

***

### model

```ts
readonly model: `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/provider.ts:58](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L58)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/provider.ts:63](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L63)

When set, the caller wants structured output (JSON mode) validated by this schema.

***

### system

```ts
readonly system: string;
```

Defined in: [packages/core/src/protocol/provider.ts:59](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L59)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [packages/core/src/protocol/provider.ts:61](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/provider.ts#L61)
