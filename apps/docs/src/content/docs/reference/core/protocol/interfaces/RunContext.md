---
editUrl: false
next: false
prev: false
title: "RunContext"
---

Defined in: [packages/core/src/protocol/context.ts:57](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L57)

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

Defined in: [packages/core/src/protocol/context.ts:58](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L58)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/protocol/context.ts:104](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L104)

The run's [ProviderRegistry](/mithril/reference/core/protocol/interfaces/providerregistry/), if one was supplied. Present so a sub-agent launched from a tool
automatically inherits it and can resolve bare-string model ids.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/context.ts:59](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L59)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/context.ts:94](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L94)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/context.ts:61](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L61)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/context.ts:60](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L60)

***

### tools

```ts
readonly tools: RunToolRegistry<Deps>;
```

Defined in: [packages/core/src/protocol/context.ts:74](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L74)

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

Defined in: [packages/core/src/protocol/context.ts:99](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L99)

The run's resolved [Transport](/mithril/reference/core/protocol/type-aliases/transport/) (after the env-BYOK default is applied). Present so a sub-agent
launched from a tool (see asTool) automatically inherits the parent's credentials/endpoint.

***

### usage

```ts
readonly usage: Readonly<UsageTotals>;
```

Defined in: [packages/core/src/protocol/context.ts:75](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L75)

## Methods

### emit()

```ts
emit(payload, type?): void;
```

Defined in: [packages/core/src/protocol/context.ts:106](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L106)

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

Defined in: [packages/core/src/protocol/context.ts:117](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L117)

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

### reportUsage()

```ts
reportUsage(delta): void;
```

Defined in: [packages/core/src/protocol/context.ts:93](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L93)

Charge tokens/cost spent *inside* a tool to the run that called it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `delta` | [`UsageDelta`](/mithril/reference/core/protocol/interfaces/usagedelta/) | the usage to add to the run's running totals. |

#### Returns

`void`

#### Remarks

Without this, spend that does not flow through the loop's own model call is invisible: a tool
that runs a sub-agent (see asTool), calls a provider directly, or proxies an LLM over MCP would
report zero. That matters beyond reporting — `maxTokens`/`maxCostMicroUsd` are checked against these
totals, so unreported spend is spend no budget can stop. Emits a `usage` event so the run's event log
and any consumer see it too.

#### Example

```ts
const res = await child.run(task, opts);
ctx.reportUsage(res.usage); // the delegated tokens now count against the parent's budget
```

***

### suspend()

```ts
suspend<Req>(req): Promise<ResolutionOf<Req>>;
```

Defined in: [packages/core/src/protocol/context.ts:115](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/context.ts#L115)

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
