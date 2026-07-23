---
editUrl: false
next: false
prev: false
title: "RuntimeAdapter"
---

Defined in: [packages/core/src/protocol/context.ts:18](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L18)

The single ambient-capability seam: every non-deterministic or platform
primitive an agent needs, injectable for deterministic replay.

## Remarks

Built from `globalThis` by default. `subtle` is optional because
`getRandomValues` is available in insecure browser contexts while
`SubtleCrypto` is not — ids derive from `getRandomValues`, and `subtle` is
demanded only by seal/open.

## Properties

### fetch

```ts
readonly fetch: {
  (input, init?): Promise<Response>;
  (input, init?): Promise<Response>;
};
```

Defined in: [packages/core/src/protocol/context.ts:19](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L19)

#### Call Signature

```ts
(input, init?): Promise<Response>;
```

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `RequestInfo` \| `URL` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\<`Response`\>

#### Call Signature

```ts
(input, init?): Promise<Response>;
```

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` \| `Request` \| `URL` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\<`Response`\>

***

### getRandomValues

```ts
readonly getRandomValues: <T>(array) => T;
```

Defined in: [packages/core/src/protocol/context.ts:23](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L23)

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `ArrayBufferView`\<`ArrayBufferLike`\> \| `null` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `array` | `T` |

#### Returns

`T`

***

### now

```ts
readonly now: () => number;
```

Defined in: [packages/core/src/protocol/context.ts:21](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L21)

Current epoch time in milliseconds; the source of every event's `ts`.

#### Returns

`number`

***

### randomUUID

```ts
readonly randomUUID: () => string;
```

Defined in: [packages/core/src/protocol/context.ts:22](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L22)

#### Returns

`string`

***

### subtle?

```ts
readonly optional subtle?: SubtleCrypto;
```

Defined in: [packages/core/src/protocol/context.ts:25](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/context.ts#L25)

Optional; required only by seal/open, absent in insecure browser contexts.
