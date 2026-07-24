---
editUrl: false
next: false
prev: false
title: "RunContext"
---

Defined in: [packages/core/src/protocol/context.ts:56](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L56)

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

Defined in: [packages/core/src/protocol/context.ts:57](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L57)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/protocol/context.ts:72](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L72)

The run's [ProviderRegistry](/mithril/reference/core/protocol/interfaces/providerregistry/), if one was supplied. Present so a sub-agent launched from a tool
automatically inherits it and can resolve bare-string model ids.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/context.ts:58](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L58)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/context.ts:62](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L62)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/context.ts:60](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L60)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/context.ts:59](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L59)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/protocol/context.ts:67](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L67)

The run's resolved [Transport](/mithril/reference/core/protocol/type-aliases/transport/) (after the env-BYOK default is applied). Present so a sub-agent
launched from a tool (see asTool) automatically inherits the parent's credentials/endpoint.

***

### usage

```ts
readonly usage: Readonly<UsageTotals>;
```

Defined in: [packages/core/src/protocol/context.ts:61](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L61)

## Methods

### emit()

```ts
emit(payload, type?): void;
```

Defined in: [packages/core/src/protocol/context.ts:74](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L74)

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

Defined in: [packages/core/src/protocol/context.ts:85](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L85)

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

Defined in: [packages/core/src/protocol/context.ts:83](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/context.ts#L83)

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
