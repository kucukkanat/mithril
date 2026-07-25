---
editUrl: false
next: false
prev: false
title: "RunContext"
---

Defined in: [packages/core/src/protocol/context.ts:57](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L57)

The typed dependency-injection context threaded into tools and dynamic
instructions.

## Remarks

No globals: `deps` are re-injected every run/resume and are never serialized.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | The caller-defined dependency bag. |

## Properties

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/protocol/context.ts:58](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L58)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/protocol/context.ts:86](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L86)

The run's [ProviderRegistry](/mithril/reference/core/protocol/interfaces/providerregistry/), if one was supplied. Present so a sub-agent launched from a tool
automatically inherits it and can resolve bare-string model ids.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/context.ts:59](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L59)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/context.ts:76](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L76)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/context.ts:61](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L61)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/context.ts:60](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L60)

***

### tools

```ts
readonly tools: RunToolRegistry<Deps>;
```

Defined in: [packages/core/src/protocol/context.ts:74](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L74)

The run's live tool set — inspect it, and (inside `execute`) define new tools.

#### Remarks

Mutations are **deferred**: they land when this call commits, so a call that throws or suspends
registers nothing, and concurrent calls in one step commit in call order. A tool registered during
step N becomes callable at step N+1 — the loop snapshots the registry once per step so the model is
offered exactly the tools that will dispatch.

`register`/`revoke` are available only inside a tool's `execute`; on the contexts used for dynamic
instructions and `needsApproval` predicates they reject with `NOT_IMPLEMENTED`, as `suspend` does.

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/protocol/context.ts:81](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L81)

The run's resolved [Transport](/mithril/reference/core/protocol/type-aliases/transport/) (after the env-BYOK default is applied). Present so a sub-agent
launched from a tool (see asTool) automatically inherits the parent's credentials/endpoint.

***

### usage

```ts
readonly usage: Readonly<UsageTotals>;
```

Defined in: [packages/core/src/protocol/context.ts:75](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L75)

## Methods

### emit()

```ts
emit(payload, type?): void;
```

Defined in: [packages/core/src/protocol/context.ts:88](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L88)

Push a first-class `custom.*` event into the stream.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) |
| `type?` | `` `custom.${string}` `` |

#### Returns

`void`

***

### journal()

```ts
journal<T>(
   key, 
   fn, 
schema?): Promise<T>;
```

Defined in: [packages/core/src/protocol/context.ts:99](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L99)

Journaled, exactly-once effect. Memoized into the log; skipped on Tier-2 replay.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `fn` | () => `Promise`\<`T`\> |
| `schema?` | [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `T`\> |

#### Returns

`Promise`\<`T`\>

***

### suspend()

```ts
suspend<Req>(req): Promise<ResolutionOf<Req>>;
```

Defined in: [packages/core/src/protocol/context.ts:97](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/context.ts#L97)

Tier-2 HITL: suspend mid-tool execution and resume with the resolution as the return value.

#### Type Parameters

| Type Parameter |
| ------ |
| `Req` *extends* [`SuspensionRequest`](/mithril/reference/core/protocol/interfaces/suspensionrequest/)\<`string`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/), [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | `Req` |

#### Returns

`Promise`\<[`ResolutionOf`](/mithril/reference/core/protocol/type-aliases/resolutionof/)\<`Req`\>\>

#### Remarks

Calling this pauses the run with `req` as the pending [SuspensionRequest](/mithril/reference/core/protocol/interfaces/suspensionrequest/); the effect is
journaled so the surrounding `execute` is not re-run on resume. Resume via
`resume(token, { kind: "resolve", value })`, and `value` becomes this call's return.
