---
editUrl: false
next: false
prev: false
title: "MiddlewareContext"
---

Defined in: [packages/core/src/protocol/middleware.ts:34](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L34)

The context handed to a [Middleware](/reference/core/protocol/interfaces/middleware/) — a subset of [RunContext](/reference/core/protocol/interfaces/runcontext/)
without the tool-facing `deps.suspend` seam.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | The caller-defined dependency bag. |

## Properties

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/protocol/middleware.ts:35](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L35)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:36](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L36)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/middleware.ts:39](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L39)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/middleware.ts:38](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L38)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/middleware.ts:37](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L37)

## Methods

### emit()

```ts
emit(event): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:42](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L42)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`DraftEvent`](/reference/core/protocol/type-aliases/draftevent/) |

#### Returns

`void`

***

### journal()

```ts
journal<T>(key, fn): Promise<T>;
```

Defined in: [packages/core/src/protocol/middleware.ts:41](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L41)

Journaled effect — the sanctioned store for a caching middleware (replayable, not a hidden closure).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `fn` | () => `Promise`\<`T`\> |

#### Returns

`Promise`\<`T`\>
