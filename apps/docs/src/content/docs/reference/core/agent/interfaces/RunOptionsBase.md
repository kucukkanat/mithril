---
editUrl: false
next: false
prev: false
title: "RunOptionsBase"
---

Defined in: [packages/core/src/agent/agent-types.ts:45](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L45)

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

Defined in: [packages/core/src/agent/agent-types.ts:56](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L56)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:52](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L52)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:50](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L50)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:51](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L51)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/agent-types.ts:47](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L47)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/agent-types.ts:49](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L49)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/agent-types.ts:48](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L48)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/agent-types.ts:46](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L46)
