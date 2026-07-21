---
editUrl: false
next: false
prev: false
title: "RunContext"
---

Defined in: packages/core/src/protocol/context.ts:55

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

Defined in: packages/core/src/protocol/context.ts:56

***

### runId

```ts
readonly runId: string;
```

Defined in: packages/core/src/protocol/context.ts:57

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: packages/core/src/protocol/context.ts:61

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: packages/core/src/protocol/context.ts:59

***

### step

```ts
readonly step: number;
```

Defined in: packages/core/src/protocol/context.ts:58

***

### usage

```ts
readonly usage: Readonly<UsageTotals>;
```

Defined in: packages/core/src/protocol/context.ts:60

## Methods

### emit()

```ts
emit(payload, type?): void;
```

Defined in: packages/core/src/protocol/context.ts:63

Push a first-class `custom.*` event into the stream.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) |
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

Defined in: packages/core/src/protocol/context.ts:73

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
| `schema?` | [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `T`\> |

#### Returns

`Promise`\<`T`\>

***

### suspend()

```ts
suspend<Req>(req): Promise<ResolutionOf<Req>>;
```

Defined in: packages/core/src/protocol/context.ts:71

Tier-2 HITL: suspend mid-tool with a typed, validated resolution.

#### Type Parameters

| Type Parameter |
| ------ |
| `Req` *extends* [`SuspensionRequest`](/reference/core/protocol/interfaces/suspensionrequest/)\<`string`, [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/), [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | `Req` |

#### Returns

`Promise`\<[`ResolutionOf`](/reference/core/protocol/type-aliases/resolutionof/)\<`Req`\>\>

#### Remarks

Not wired in this slice — the runtime implementation rejects with a
`NOT_IMPLEMENTED` error. The signature is part of the stable protocol shape.
