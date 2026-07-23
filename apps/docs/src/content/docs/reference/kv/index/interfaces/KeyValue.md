---
editUrl: false
next: false
prev: false
title: "KeyValue"
---

Defined in: [index.ts:20](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/kv/src/index.ts#L20)

A runtime-agnostic async key-value store (§10.2) for tools — caches, dedup sets, counters, scratch state.

## Remarks

Injected into tools via `Deps` (`ctx.deps.kv`). Implementations must pass [kvConformance](/reference/kv/index/functions/kvconformance/);
[memoryKv](/reference/kv/index/functions/memorykv/) is the reference in-memory impl, with indexeddb/sqlite/workerd-KV backends behind
per-runtime subpaths.

## Methods

### delete()

```ts
delete(key): Promise<void>;
```

Defined in: [index.ts:34](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/kv/src/index.ts#L34)

Removes `key` if present; a no-op otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get<T>(key): Promise<T | undefined>;
```

Defined in: [index.ts:25](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/kv/src/index.ts#L25)

Reads the value at `key`, or `undefined` if absent or expired.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` | `unknown` | Expected value type; the stored value is cast to `T` (unchecked). |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<`T` \| `undefined`\>

***

### has()

```ts
has(key): Promise<boolean>;
```

Defined in: [index.ts:36](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/kv/src/index.ts#L36)

Returns `true` if `key` exists and has not expired.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<`boolean`\>

***

### set()

```ts
set(
   key, 
   value, 
opts?): Promise<void>;
```

Defined in: [index.ts:32](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/kv/src/index.ts#L32)

Writes `value` at `key`, overwriting any existing entry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | - |
| `value` | `unknown` | - |
| `opts?` | \{ `ttlMs?`: `number`; \} | Optional `{ ttlMs }` — expire the entry that many milliseconds from now (a key is treated as expired once its expiry is `<=` the current time, so `ttlMs: 0` expires immediately). Omit for no expiry. |
| `opts.ttlMs?` | `number` | - |

#### Returns

`Promise`\<`void`\>
