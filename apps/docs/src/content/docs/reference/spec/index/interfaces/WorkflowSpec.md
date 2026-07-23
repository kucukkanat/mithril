---
editUrl: false
next: false
prev: false
title: "WorkflowSpec"
---

Defined in: [packages/spec/src/types.ts:121](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L121)

A `const <id> = defineWorkflow({ … }, { start })` declaration.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:123](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L123)

***

### kind

```ts
readonly kind: "workflow";
```

Defined in: [packages/spec/src/types.ts:122](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L122)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/spec/src/types.ts:128](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L128)

***

### start

```ts
readonly start: string;
```

Defined in: [packages/spec/src/types.ts:127](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L127)

***

### stateType?

```ts
readonly optional stateType?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:125](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L125)

An adjacent `interface`/`type` declaration for the state shape, stored verbatim.

***

### steps

```ts
readonly steps: readonly WorkflowStepSpec[];
```

Defined in: [packages/spec/src/types.ts:126](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L126)
