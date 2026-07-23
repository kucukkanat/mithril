---
editUrl: false
next: false
prev: false
title: "WorkflowSpec"
---

Defined in: packages/spec/src/types.ts:124

A `const <id> = defineWorkflow({ … }, { start })` declaration.

## Properties

### id

```ts
readonly id: string;
```

Defined in: packages/spec/src/types.ts:126

***

### kind

```ts
readonly kind: "workflow";
```

Defined in: packages/spec/src/types.ts:125

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: packages/spec/src/types.ts:131

***

### start

```ts
readonly start: string;
```

Defined in: packages/spec/src/types.ts:130

***

### stateType?

```ts
readonly optional stateType?: CodeRegion;
```

Defined in: packages/spec/src/types.ts:128

An adjacent `interface`/`type` declaration for the state shape, stored verbatim.

***

### steps

```ts
readonly steps: readonly WorkflowStepSpec[];
```

Defined in: packages/spec/src/types.ts:129
