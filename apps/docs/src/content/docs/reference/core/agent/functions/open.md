---
editUrl: false
next: false
prev: false
title: "open"
---

```ts
function open(
   token, 
   keyring, 
   rt?, 
opts?): Promise<string>;
```

Defined in: [packages/core/src/agent/seal.ts:216](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/seal.ts#L216)

Verify a sealed token and recover its original body.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | a `header.payload.digest` string produced by [seal](/reference/core/agent/functions/seal/). |
| `keyring` | [`Keyring`](/reference/core/agent/interfaces/keyring/) | resolves the verification key by the envelope's `kid`. |
| `rt?` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |
| `opts?` | \{ `codec?`: [`SealCodec`](/reference/core/agent/interfaces/sealcodec/); `maxBytes?`: `number`; \} | `codec` must match the sealing codec (default [hmacCodec](/reference/core/agent/functions/hmaccodec/)); `maxBytes` caps token size (default 4 MiB) as a cheap DoS guard before any crypto runs. |
| `opts.codec?` | [`SealCodec`](/reference/core/agent/interfaces/sealcodec/) | - |
| `opts.maxBytes?` | `number` | - |

## Returns

`Promise`\<`string`\>

the recovered plaintext body.

## Throws

[StateIntegrityError](/reference/core/agent/classes/stateintegrityerror/) on oversize input, a malformed 3-part envelope or header, an
unresolvable `kid`, failed HMAC verification (possible tampering), or a codec-id mismatch.

## Example

```ts
import { open, StateIntegrityError } from "@mithril/core/agent";

try {
  const body = await open(token, keyring);
  const result = await agent.resume(body, { kind: "approve" }, { deps });
} catch (err) {
  if (err instanceof StateIntegrityError) {
    // tampered, expired key, or wrong codec — reject the token
  }
}
```
