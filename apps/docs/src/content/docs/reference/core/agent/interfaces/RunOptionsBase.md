---
editUrl: false
next: false
prev: false
title: "RunOptionsBase"
---

Defined in: [packages/core/src/agent/agent-types.ts:48](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L48)

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

Defined in: [packages/core/src/agent/agent-types.ts:63](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L63)

***

### maxConcurrentTools?

```ts
readonly optional maxConcurrentTools?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:59](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L59)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:58](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L58)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:56](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L56)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:57](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L57)

***

### persistence?

```ts
readonly optional persistence?: Persistence;
```

Defined in: [packages/core/src/agent/agent-types.ts:55](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L55)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/agent-types.ts:50](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L50)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/agent-types.ts:52](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L52)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/agent-types.ts:51](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L51)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/agent-types.ts:49](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L49)
