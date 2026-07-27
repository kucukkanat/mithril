---
editUrl: false
next: false
prev: false
title: "RunTokenV2"
---

Defined in: [packages/core/src/agent/loop.ts:167](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L167)

The versioned, serializable run token carried by a `suspended` [RunResult](/mithril/reference/core/agent/type-aliases/runresult/).

## Remarks

Still exported so an older stored token can be read; [RunTokenV3](/mithril/reference/core/agent/interfaces/runtokenv3/) is what the loop emits.

## Properties

### messages

```ts
readonly messages: readonly LoopMessage[];
```

Defined in: [packages/core/src/agent/loop.ts:171](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L171)

***

### model

```ts
readonly model: string;
```

Defined in: [packages/core/src/agent/loop.ts:170](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L170)

***

### pending

```ts
readonly pending: PendingSuspension;
```

Defined in: [packages/core/src/agent/loop.ts:174](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L174)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/agent/loop.ts:169](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L169)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/loop.ts:173](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L173)

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/agent/loop.ts:172](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L172)

***

### v

```ts
readonly v: 2;
```

Defined in: [packages/core/src/agent/loop.ts:168](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L168)
