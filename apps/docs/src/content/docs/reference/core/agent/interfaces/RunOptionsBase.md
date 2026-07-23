---
editUrl: false
next: false
prev: false
title: "RunOptionsBase"
---

Defined in: [packages/core/src/agent/agent-types.ts:44](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L44)

The run options common to every agent, independent of whether it has dependencies.

## Properties

### loopDetection?

```ts
readonly optional loopDetection?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:51](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L51)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:53](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L53)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:49](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L49)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:52](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L52)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/agent-types.ts:46](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L46)

***

### repair?

```ts
readonly optional repair?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:54](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L54)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/agent-types.ts:48](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L48)

***

### selfCorrection?

```ts
readonly optional selfCorrection?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:55](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L55)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/agent-types.ts:47](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L47)

***

### toolRetries?

```ts
readonly optional toolRetries?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:50](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L50)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/agent-types.ts:45](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L45)
