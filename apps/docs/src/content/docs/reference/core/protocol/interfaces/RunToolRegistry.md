---
editUrl: false
next: false
prev: false
title: "RunToolRegistry"
---

Defined in: [packages/core/src/protocol/tool-registry.ts:118](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L118)

The narrowed registry view handed to a tool's `execute` as `ctx.tools`.

## Remarks

**Deferred commit.** `register` and `revoke` do not mutate the run's registry immediately: they queue
the mutation and its event, both applied when the *call* commits. So a call that throws or suspends
registers nothing, and concurrent calls in one step commit in strict call order — the live registry and
`replay(log)` therefore agree by construction.

Available only inside `execute`. On the contexts used for dynamic instructions and `needsApproval`
predicates, `register`/`revoke` reject with `NOT_IMPLEMENTED`, mirroring `ctx.suspend`.

There is deliberately no way to add middleware here. Middleware wraps *every* tool call and can rewrite
inputs and outputs — far more authority than a tool, with no per-call approval surface.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the dependency bag the registered tools require. |

## Methods

### get()

```ts
get(name): 
  | AnyTool<unknown>
  | undefined;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:134](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L134)

The executable tool, so a composing tool can call another.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

  \| [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`unknown`\>
  \| `undefined`

#### Remarks

Returns the `unknown`-erased bound rather than `AnyTool<Deps>`, for two reasons. Practically, the
registry holds tools from heterogeneous sources — a runtime-defined tool typically closes over its own
data and ignores `deps` entirely — so claiming they all share this run's `Deps` would be a fiction.
Structurally, `AnyTool<Deps>` here would put `Deps` in a covariant position inside `RunContext<Deps>`
while `register` puts it in a contravariant one, making `RunContext` invariant — which would break the
everyday assignment of a `tool()`-defined (`Deps = unknown`) tool into a no-deps (`Deps = void`) agent.

Calling the result still typechecks: `RunContext<Deps>` is assignable to `RunContext<unknown>`.

***

### has()

```ts
has(name): boolean;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:120](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L120)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### register()

```ts
register(tool, definition): void;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:135](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L135)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\> |
| `definition` | [`ToolDefinition`](/mithril/reference/core/protocol/interfaces/tooldefinition/) |

#### Returns

`void`

***

### revoke()

```ts
revoke(name): boolean;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:136](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L136)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### summaries()

```ts
summaries(): readonly ToolSummary[];
```

Defined in: [packages/core/src/protocol/tool-registry.ts:119](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L119)

#### Returns

readonly [`ToolSummary`](/mithril/reference/core/protocol/interfaces/toolsummary/)[]
