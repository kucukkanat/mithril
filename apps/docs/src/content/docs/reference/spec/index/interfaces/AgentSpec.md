---
editUrl: false
next: false
prev: false
title: "AgentSpec"
---

Defined in: [packages/spec/src/types.ts:65](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L65)

A `const <id> = agent({ … })` declaration. Field order mirrors core's `AgentConfig`.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:67](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L67)

***

### instructions

```ts
readonly instructions: string | CodeRegion;
```

Defined in: [packages/spec/src/types.ts:70](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L70)

A static string, or an instructions function of `ctx` stored verbatim.

***

### kind

```ts
readonly kind: "agent";
```

Defined in: [packages/spec/src/types.ts:66](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L66)

***

### loopDetection?

```ts
readonly optional loopDetection?: boolean;
```

Defined in: [packages/spec/src/types.ts:78](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L78)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/spec/src/types.ts:80](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L80)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:75](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L75)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/spec/src/types.ts:79](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L79)

***

### model

```ts
readonly model: ModelSpec;
```

Defined in: [packages/spec/src/types.ts:68](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L68)

***

### output?

```ts
readonly optional output?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:74](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L74)

Structured output schema.

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: [packages/spec/src/types.ts:76](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L76)

***

### repair?

```ts
readonly optional repair?: boolean;
```

Defined in: [packages/spec/src/types.ts:81](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L81)

***

### selfCorrection?

```ts
readonly optional selfCorrection?: boolean;
```

Defined in: [packages/spec/src/types.ts:82](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L82)

***

### toolRetries?

```ts
readonly optional toolRetries?: number;
```

Defined in: [packages/spec/src/types.ts:77](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L77)

***

### tools

```ts
readonly tools: readonly string[];
```

Defined in: [packages/spec/src/types.ts:72](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L72)

Ids of ToolSpec / SubAgentToolSpec decls, in attachment order.

***

### use?

```ts
readonly optional use?: readonly CodeRegion[];
```

Defined in: [packages/spec/src/types.ts:84](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L84)

Middleware / plugin expressions (`use: […]`), each stored verbatim.
