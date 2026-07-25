---
editUrl: false
next: false
prev: false
title: "CompositionStep"
---

Defined in: compose.ts:22

One step: call a registered tool with an object assembled from [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/)s.

## Properties

### args

```ts
readonly args: Readonly<Record<string, ValueRef>>;
```

Defined in: compose.ts:27

***

### id

```ts
readonly id: string;
```

Defined in: compose.ts:24

Unique within the composition; later steps reference this step's output by it.

***

### tool

```ts
readonly tool: string;
```

Defined in: compose.ts:26

The name of a tool that must already exist when the composition is defined.
