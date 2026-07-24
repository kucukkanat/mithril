---
editUrl: false
next: false
prev: false
title: "ModelResult"
---

Defined in: [packages/core/src/protocol/middleware.ts:86](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L86)

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

Defined in: [packages/core/src/protocol/middleware.ts:90](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L90)

***

### finishReason

```ts
readonly finishReason: FinishReason;
```

Defined in: [packages/core/src/protocol/middleware.ts:88](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L88)

***

### text

```ts
readonly text: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:87](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L87)

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: [packages/core/src/protocol/middleware.ts:89](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L89)
