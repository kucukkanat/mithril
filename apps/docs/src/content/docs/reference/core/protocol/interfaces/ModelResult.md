---
editUrl: false
next: false
prev: false
title: "ModelResult"
---

Defined in: [packages/core/src/protocol/middleware.ts:54](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L54)

The result of one model invocation seen by a [Middleware.model](/reference/core/protocol/interfaces/middleware/#model) wrapper.

## Properties

### calls

```ts
readonly calls: readonly {
  callId: string;
  input: JsonValue;
  name: string;
}[];
```

Defined in: [packages/core/src/protocol/middleware.ts:58](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L58)

***

### finishReason

```ts
readonly finishReason: FinishReason;
```

Defined in: [packages/core/src/protocol/middleware.ts:56](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L56)

***

### text

```ts
readonly text: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:55](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L55)

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: [packages/core/src/protocol/middleware.ts:57](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L57)
