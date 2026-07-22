---
editUrl: false
next: false
prev: false
title: "RunContext"
---

Defined in: [packages/core/src/protocol/context.ts:55](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L55)

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

Defined in: [packages/core/src/protocol/context.ts:56](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L56)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/context.ts:57](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L57)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/context.ts:61](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L61)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/context.ts:59](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L59)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/context.ts:58](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L58)

***

### usage

```ts
readonly usage: Readonly<UsageTotals>;
```

Defined in: [packages/core/src/protocol/context.ts:60](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L60)

## Methods

### emit()

```ts
emit(payload, type?): void;
```

Defined in: [packages/core/src/protocol/context.ts:63](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L63)

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

Defined in: [packages/core/src/protocol/context.ts:74](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L74)

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

Defined in: [packages/core/src/protocol/context.ts:72](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/context.ts#L72)

Tier-2 HITL: suspend mid-tool execution and resume with the resolution as the return value.

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

Calling this pauses the run with `req` as the pending [SuspensionRequest](/reference/core/protocol/interfaces/suspensionrequest/); the effect is
journaled so the surrounding `execute` is not re-run on resume. Resume via
`resume(token, { kind: "resolve", value })`, and `value` becomes this call's return.
