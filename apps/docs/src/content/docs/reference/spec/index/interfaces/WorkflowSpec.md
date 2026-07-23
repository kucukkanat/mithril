---
editUrl: false
next: false
prev: false
title: "WorkflowSpec"
---

Defined in: [packages/spec/src/types.ts:124](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L124)

A `const <id> = defineWorkflow({ … }, { start })` declaration.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:126](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L126)

***

### kind

```ts
readonly kind: "workflow";
```

Defined in: [packages/spec/src/types.ts:125](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L125)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:131](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L131)

***

### start

```ts
readonly start: string;
```

Defined in: [packages/spec/src/types.ts:130](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L130)

***

### stateType?

```ts
readonly optional stateType?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:128](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L128)

An adjacent `interface`/`type` declaration for the state shape, stored verbatim.

***

### steps

```ts
readonly steps: readonly WorkflowStepSpec[];
```

Defined in: [packages/spec/src/types.ts:129](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L129)
