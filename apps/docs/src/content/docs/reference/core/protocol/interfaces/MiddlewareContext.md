---
editUrl: false
next: false
prev: false
title: "MiddlewareContext"
---

Defined in: [packages/core/src/protocol/middleware.ts:46](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L46)

The context handed to a [Middleware](/mithril/reference/core/protocol/interfaces/middleware/) — a subset of [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/)
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

Defined in: [packages/core/src/protocol/middleware.ts:47](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L47)

***

### halted

```ts
readonly halted: boolean;
```

Defined in: [packages/core/src/protocol/middleware.ts:68](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L68)

`true` once any middleware has [halt](/mithril/reference/core/protocol/interfaces/middlewarecontext/#halt)ed this run; a later middleware should no-op on its own guard.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:48](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L48)

***

### runtime

```ts
readonly runtime: RuntimeAdapter;
```

Defined in: [packages/core/src/protocol/middleware.ts:51](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L51)

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [packages/core/src/protocol/middleware.ts:50](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L50)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/middleware.ts:49](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L49)

## Methods

### emit()

```ts
emit(event): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:54](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L54)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`DraftEvent`](/mithril/reference/core/protocol/type-aliases/draftevent/) |

#### Returns

`void`

***

### halt()

```ts
halt(error): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:66](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L66)

End the run now with a typed terminal error — a healing middleware's halt decision (budget exhausted,
an unbreakable loop). The **first** halt of a run wins; later calls are ignored, and [halted](/mithril/reference/core/protocol/interfaces/middlewarecontext/#halted)
flips to `true` so a middleware composed further out can bow out rather than pile on.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`SerializedError`](/mithril/reference/core/protocol/interfaces/serializederror/) |

#### Returns

`void`

***

### journal()

```ts
journal<T>(key, fn): Promise<T>;
```

Defined in: [packages/core/src/protocol/middleware.ts:53](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L53)

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

***

### scope()

```ts
scope<T>(key, init): T;
```

Defined in: [packages/core/src/protocol/middleware.ts:74](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L74)

Run-scoped mutable state, created once per `key` and shared across every step of the run (never across
runs, so a reused agent's runs stay isolated). The sanctioned place for a healing middleware to keep its
per-run counters (repair budgets, loop signatures, retry attempts).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `init` | () => `T` |

#### Returns

`T`

***

### steer()

```ts
steer(message): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:60](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L60)

Inject a `user` steering turn into the transcript and let the loop take another step (a re-ask). Used
by a healing middleware that wants the model to try again — e.g. loop-detection's nudge or structured
output's "your reply did not match the schema" retry. Emit the matching event yourself via [emit](/mithril/reference/core/protocol/interfaces/middlewarecontext/#emit).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |

#### Returns

`void`
