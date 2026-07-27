---
editUrl: false
next: false
prev: false
title: "PluginHost"
---

Defined in: [packages/core/src/protocol/middleware.ts:220](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L220)

The registration surface passed to [Plugin.setup](/mithril/reference/core/protocol/interfaces/plugin/#setup), once per run, before step 0.

## Remarks

`setup` is how a plugin contributes capabilities it can only know at run time — tools loaded from a
store, discovered from a remote server, or derived from `deps`. That is why `deps` is exposed here: a
multi-tenant host needs to pick a store or a scope per run, which is impossible from a static
`Plugin.tools` array.

The host is **sealed** once `setup` resolves: calling any method afterwards throws `HOST_SEALED`,
because the middleware chain and the step-0 tool snapshot are both built the moment setups finish.

A tool can never reach this surface. Middleware wraps *every* tool call and can rewrite inputs and
outputs — far more authority than a tool, with no per-call approval gate — so it is registrable only
here, by the agent's author, and never by the agent.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the dependency bag this run's tools and middleware receive. |

## Properties

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/protocol/middleware.ts:225](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L225)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:226](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L226)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/middleware.ts:227](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L227)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/middleware.ts:228](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L228)

***

### tools

```ts
readonly tools: ToolRegistry<Deps>;
```

Defined in: [packages/core/src/protocol/middleware.ts:224](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L224)

The run's live registry, for registering a tool with an explicit [ToolDefinition](/mithril/reference/core/protocol/interfaces/tooldefinition/).

## Methods

### emit()

```ts
emit(event): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:229](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L229)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`DraftEvent`](/mithril/reference/core/protocol/type-aliases/draftevent/) |

#### Returns

`void`

***

### register()

```ts
register(fragment): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:222](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L222)

Contribute a plugin fragment: tools, middleware, and/or consumers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fragment` | `Partial`\<[`Plugin`](/mithril/reference/core/protocol/interfaces/plugin/)\<`Deps`\>\> |

#### Returns

`void`
