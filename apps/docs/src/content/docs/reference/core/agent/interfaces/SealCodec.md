---
editUrl: false
next: false
prev: false
title: "SealCodec"
---

Defined in: packages/core/src/agent/seal.ts:56

A payload transform applied before signing (encode) and after verifying (decode) in the seal envelope.

## Remarks

The HMAC signature is always applied by [seal](/reference/core/agent/functions/seal/); the codec optionally transforms the
payload bytes underneath it. `id` is recorded in the envelope header and checked on [open](/reference/core/agent/functions/open/).
Built-ins: [hmacCodec](/reference/core/agent/functions/hmaccodec/) (identity — integrity only) and [aesGcmCodec](/reference/core/agent/functions/aesgcmcodec/) (at-rest confidentiality).

## Properties

### id

```ts
readonly id: string;
```

Defined in: packages/core/src/agent/seal.ts:57

## Methods

### decode()

```ts
decode(bytes, rt?): Promise<Uint8Array<ArrayBufferLike>>;
```

Defined in: packages/core/src/agent/seal.ts:59

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `rt?` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) |

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

***

### encode()

```ts
encode(bytes, rt?): Promise<Uint8Array<ArrayBufferLike>>;
```

Defined in: packages/core/src/agent/seal.ts:58

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `rt?` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) |

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>
