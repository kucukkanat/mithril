---
editUrl: false
next: false
prev: false
title: "RunOptionsBase"
---

Defined in: [packages/core/src/agent/agent-types.ts:46](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L46)

The run options common to every agent, independent of whether it has dependencies.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Properties

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/agent-types.ts:60](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L60)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:56](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L56)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:54](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L54)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:55](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L55)

***

### persistence?

```ts
readonly optional persistence?: Persistence;
```

Defined in: [packages/core/src/agent/agent-types.ts:53](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L53)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/agent-types.ts:48](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L48)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/agent-types.ts:50](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L50)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/agent-types.ts:49](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L49)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/agent-types.ts:47](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L47)
