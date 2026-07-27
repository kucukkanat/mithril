---
editUrl: false
next: false
prev: false
title: "AgentSpec"
---

Defined in: [packages/spec/src/types.ts:71](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L71)

A `const <id> = agent({ … })` declaration. Field order mirrors core's `AgentConfig`.

## Properties

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly CodeRegion[];
```

Defined in: [packages/spec/src/types.ts:85](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L85)

Self-healing stack: `false` for a raw loop, or middleware expressions (`healing.*`) stored verbatim.

***

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:73](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L73)

***

### instructions

```ts
readonly instructions: 
  | string
  | CodeRegion;
```

Defined in: [packages/spec/src/types.ts:76](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L76)

A static string, or an instructions function of `ctx` stored verbatim.

***

### kind

```ts
readonly kind: "agent";
```

Defined in: [packages/spec/src/types.ts:72](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L72)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/spec/src/types.ts:83](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L83)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:81](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L81)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/spec/src/types.ts:82](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L82)

***

### model

```ts
readonly model: ModelSpec;
```

Defined in: [packages/spec/src/types.ts:74](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L74)

***

### output?

```ts
readonly optional output?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:80](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L80)

Structured output schema.

***

### tools

```ts
readonly tools: readonly string[];
```

Defined in: [packages/spec/src/types.ts:78](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L78)

Ids of ToolSpec / SubAgentToolSpec decls, in attachment order.

***

### use?

```ts
readonly optional use?: readonly CodeRegion[];
```

Defined in: [packages/spec/src/types.ts:87](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L87)

Middleware / plugin expressions (`use: […]`), each stored verbatim.
