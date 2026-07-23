---
editUrl: false
next: false
prev: false
title: "AgentSpec"
---

Defined in: packages/spec/src/types.ts:65

A `const <id> = agent({ … })` declaration. Field order mirrors core's `AgentConfig`.

## Properties

### id

```ts
readonly id: string;
```

Defined in: packages/spec/src/types.ts:67

***

### instructions

```ts
readonly instructions: string | CodeRegion;
```

Defined in: packages/spec/src/types.ts:70

A static string, or an instructions function of `ctx` stored verbatim.

***

### kind

```ts
readonly kind: "agent";
```

Defined in: packages/spec/src/types.ts:66

***

### loopDetection?

```ts
readonly optional loopDetection?: boolean;
```

Defined in: packages/spec/src/types.ts:78

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: packages/spec/src/types.ts:80

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: packages/spec/src/types.ts:75

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: packages/spec/src/types.ts:79

***

### model

```ts
readonly model: ModelSpec;
```

Defined in: packages/spec/src/types.ts:68

***

### output?

```ts
readonly optional output?: SchemaSpec;
```

Defined in: packages/spec/src/types.ts:74

Structured output schema.

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: packages/spec/src/types.ts:76

***

### repair?

```ts
readonly optional repair?: boolean;
```

Defined in: packages/spec/src/types.ts:81

***

### selfCorrection?

```ts
readonly optional selfCorrection?: boolean;
```

Defined in: packages/spec/src/types.ts:82

***

### toolRetries?

```ts
readonly optional toolRetries?: number;
```

Defined in: packages/spec/src/types.ts:77

***

### tools

```ts
readonly tools: readonly string[];
```

Defined in: packages/spec/src/types.ts:72

Ids of ToolSpec / SubAgentToolSpec decls, in attachment order.

***

### use?

```ts
readonly optional use?: readonly CodeRegion[];
```

Defined in: packages/spec/src/types.ts:84

Middleware / plugin expressions (`use: […]`), each stored verbatim.
