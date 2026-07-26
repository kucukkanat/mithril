---
editUrl: false
next: false
prev: false
title: "CompositionStep"
---

Defined in: [compose.ts:22](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L22)

One step: call a registered tool with an object assembled from [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/)s.

## Properties

### args

```ts
readonly args: Readonly<Record<string, ValueRef>>;
```

Defined in: [compose.ts:27](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L27)

***

### id

```ts
readonly id: string;
```

Defined in: [compose.ts:24](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L24)

Unique within the composition; later steps reference this step's output by it.

***

### tool

```ts
readonly tool: string;
```

Defined in: [compose.ts:26](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L26)

The name of a tool that must already exist when the composition is defined.
