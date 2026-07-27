---
editUrl: false
next: false
prev: false
title: "WorkflowSpec"
---

Defined in: [packages/spec/src/types.ts:127](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L127)

A `const <id> = defineWorkflow({ … }, { start })` declaration.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:129](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L129)

***

### kind

```ts
readonly kind: "workflow";
```

Defined in: [packages/spec/src/types.ts:128](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L128)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:134](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L134)

***

### start

```ts
readonly start: string;
```

Defined in: [packages/spec/src/types.ts:133](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L133)

***

### stateType?

```ts
readonly optional stateType?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:131](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L131)

An adjacent `interface`/`type` declaration for the state shape, stored verbatim.

***

### steps

```ts
readonly steps: readonly WorkflowStepSpec[];
```

Defined in: [packages/spec/src/types.ts:132](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L132)
