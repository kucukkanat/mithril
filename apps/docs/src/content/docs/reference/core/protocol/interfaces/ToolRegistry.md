---
editUrl: false
next: false
prev: false
title: "ToolRegistry"
---

Defined in: packages/core/src/protocol/tool-registry.ts:80

The live, per-run set of tools the loop resolves against.

## Remarks

Always fresh per run — a registry shared across runs would break run isolation and make replay
non-reproducible. Build one with `toolRegistry(seed)` from `@mithril/core/agent`.

Name collisions are **rejected, never shadowed**: re-registering an existing name with a different
digest throws rather than replacing. Allowing a runtime tool to shadow a static one would be a
privilege-escalation path (redefine `send_email` and the original is gone), so it is made structurally
impossible.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the dependency bag the registered tools require. |

## Properties

### revision

```ts
readonly revision: number;
```

Defined in: packages/core/src/protocol/tool-registry.ts:98

Incremented on every accepted mutation.

## Methods

### get()

```ts
get(name): 
  | AnyTool<Deps>
  | undefined;
```

Defined in: packages/core/src/protocol/tool-registry.ts:84

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

  \| [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>
  \| `undefined`

***

### has()

```ts
has(name): boolean;
```

Defined in: packages/core/src/protocol/tool-registry.ts:85

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### list()

```ts
list(): readonly AnyTool<Deps>[];
```

Defined in: packages/core/src/protocol/tool-registry.ts:82

Every registered tool, in registration order (static → plugin → setup → runtime).

#### Returns

readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[]

***

### register()

```ts
register(
   tool, 
   provenance, 
   definition?): void;
```

Defined in: packages/core/src/protocol/tool-registry.ts:90

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\> |
| `provenance` | [`ToolProvenance`](/mithril/reference/core/protocol/type-aliases/toolprovenance/) |
| `definition?` | [`ToolDefinition`](/mithril/reference/core/protocol/interfaces/tooldefinition/) |

#### Returns

`void`

#### Throws

`MithrilError` `TOOL_NAME_TAKEN` when `tool.name` is held by an entry with a different digest.
Re-registering the identical digest is a no-op, which is what makes replay and Tier-2 re-entry safe.

***

### revoke()

```ts
revoke(name): boolean;
```

Defined in: packages/core/src/protocol/tool-registry.ts:96

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

`false` when no such tool is registered.

#### Throws

`MithrilError` `TOOL_NOT_REVOCABLE` for `static` or `plugin` provenance — an agent may not
remove a capability its author declared.

***

### summaries()

```ts
summaries(): readonly ToolSummary[];
```

Defined in: packages/core/src/protocol/tool-registry.ts:83

#### Returns

readonly [`ToolSummary`](/mithril/reference/core/protocol/interfaces/toolsummary/)[]
