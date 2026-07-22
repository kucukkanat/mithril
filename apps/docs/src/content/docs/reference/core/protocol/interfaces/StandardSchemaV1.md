---
editUrl: false
next: false
prev: false
title: "StandardSchemaV1"
---

Defined in: [packages/core/src/protocol/standard-schema.ts:20](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/standard-schema.ts#L20)

The Standard Schema v1 contract — a validator-agnostic interface implemented
by Zod, Valibot, ArkType, and others.

## Remarks

This is a type-only mirror of `@standard-schema/spec@1`, vendored so
`@mithril/core` type-checks with zero install. All runtime behaviour is
supplied by the consumer's validator; there is no code to depend on.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Input` | `unknown` | The value type accepted before validation. |
| `Output` | `Input` | The validated, parsed value type. |

## Properties

### ~standard

```ts
readonly ~standard: Props<Input, Output>;
```

Defined in: [packages/core/src/protocol/standard-schema.ts:21](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/standard-schema.ts#L21)
