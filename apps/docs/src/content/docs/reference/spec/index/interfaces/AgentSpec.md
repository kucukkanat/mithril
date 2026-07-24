---
editUrl: false
next: false
prev: false
title: "AgentSpec"
---

Defined in: [packages/spec/src/types.ts:65](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L65)

A `const <id> = agent({ … })` declaration. Field order mirrors core's `AgentConfig`.

## Properties

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly CodeRegion[];
```

Defined in: [packages/spec/src/types.ts:79](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L79)

Self-healing stack: `false` for a raw loop, or middleware expressions (`healing.*`) stored verbatim.

***

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:67](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L67)

***

### instructions

```ts
readonly instructions: 
  | string
  | CodeRegion;
```

Defined in: [packages/spec/src/types.ts:70](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L70)

A static string, or an instructions function of `ctx` stored verbatim.

***

### kind

```ts
readonly kind: "agent";
```

Defined in: [packages/spec/src/types.ts:66](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L66)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/spec/src/types.ts:77](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L77)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:75](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L75)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/spec/src/types.ts:76](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L76)

***

### model

```ts
readonly model: ModelSpec;
```

Defined in: [packages/spec/src/types.ts:68](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L68)

***

### output?

```ts
readonly optional output?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:74](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L74)

Structured output schema.

***

### tools

```ts
readonly tools: readonly string[];
```

Defined in: [packages/spec/src/types.ts:72](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L72)

Ids of ToolSpec / SubAgentToolSpec decls, in attachment order.

***

### use?

```ts
readonly optional use?: readonly CodeRegion[];
```

Defined in: [packages/spec/src/types.ts:81](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L81)

Middleware / plugin expressions (`use: […]`), each stored verbatim.
