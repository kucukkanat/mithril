---
editUrl: false
next: false
prev: false
title: "ToolSpec"
---

Defined in: [packages/spec/src/types.ts:46](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L46)

A `const <id> = tool({ … })` declaration.

## Properties

### builtin?

```ts
readonly optional builtin?: string;
```

Defined in: [packages/spec/src/types.ts:61](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L61)

Provenance id when materialized from a built-in library template.

***

### description

```ts
readonly description: string;
```

Defined in: [packages/spec/src/types.ts:52](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L52)

***

### examples?

```ts
readonly optional examples?: readonly unknown[];
```

Defined in: [packages/spec/src/types.ts:55](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L55)

***

### execute

```ts
readonly execute: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:59](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L59)

The `execute` function (arrow or method form), stored verbatim.

***

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:49](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L49)

The const identifier in generated code — also the graph-node id.

***

### inputSchema

```ts
readonly inputSchema: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:53](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L53)

***

### kind

```ts
readonly kind: "tool";
```

Defined in: [packages/spec/src/types.ts:47](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L47)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:51](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L51)

The wire name (`ToolDef.name`).

***

### needsApproval?

```ts
readonly optional needsApproval?: 
  | boolean
  | CodeRegion;
```

Defined in: [packages/spec/src/types.ts:57](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L57)

`true`/`false` literal, or a predicate function stored verbatim.

***

### outputSchema?

```ts
readonly optional outputSchema?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:54](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L54)
