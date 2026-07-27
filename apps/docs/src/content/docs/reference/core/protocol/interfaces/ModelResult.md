---
editUrl: false
next: false
prev: false
title: "ModelResult"
---

Defined in: [packages/core/src/protocol/middleware.ts:87](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L87)

The result of one model invocation seen by a [Middleware.model](/mithril/reference/core/protocol/interfaces/middleware/#model) wrapper.

## Properties

### calls

```ts
readonly calls: readonly {
  callId: string;
  input: JsonValue;
  name: string;
}[];
```

Defined in: [packages/core/src/protocol/middleware.ts:91](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L91)

***

### finishReason

```ts
readonly finishReason: FinishReason;
```

Defined in: [packages/core/src/protocol/middleware.ts:89](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L89)

***

### text

```ts
readonly text: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:88](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L88)

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: [packages/core/src/protocol/middleware.ts:90](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L90)
