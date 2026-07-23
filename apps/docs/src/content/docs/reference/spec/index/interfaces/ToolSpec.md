---
editUrl: false
next: false
prev: false
title: "ToolSpec"
---

Defined in: packages/spec/src/types.ts:46

A `const <id> = tool({ … })` declaration.

## Properties

### builtin?

```ts
readonly optional builtin?: string;
```

Defined in: packages/spec/src/types.ts:61

Provenance id when materialized from a built-in library template.

***

### description

```ts
readonly description: string;
```

Defined in: packages/spec/src/types.ts:52

***

### examples?

```ts
readonly optional examples?: readonly unknown[];
```

Defined in: packages/spec/src/types.ts:55

***

### execute

```ts
readonly execute: CodeRegion;
```

Defined in: packages/spec/src/types.ts:59

The `execute` function (arrow or method form), stored verbatim.

***

### id

```ts
readonly id: string;
```

Defined in: packages/spec/src/types.ts:49

The const identifier in generated code — also the graph-node id.

***

### inputSchema

```ts
readonly inputSchema: SchemaSpec;
```

Defined in: packages/spec/src/types.ts:53

***

### kind

```ts
readonly kind: "tool";
```

Defined in: packages/spec/src/types.ts:47

***

### name

```ts
readonly name: string;
```

Defined in: packages/spec/src/types.ts:51

The wire name (`ToolDef.name`).

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | CodeRegion;
```

Defined in: packages/spec/src/types.ts:57

`true`/`false` literal, or a predicate function stored verbatim.

***

### outputSchema?

```ts
readonly optional outputSchema?: SchemaSpec;
```

Defined in: packages/spec/src/types.ts:54
