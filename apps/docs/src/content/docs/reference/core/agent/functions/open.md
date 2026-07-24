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

Defined in: [packages/core/src/agent/seal.ts:216](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/seal.ts#L216)

Verify a sealed token and recover its original body.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | a `header.payload.digest` string produced by [seal](/mithril/reference/core/agent/functions/seal/). |
| `keyring` | [`Keyring`](/mithril/reference/core/agent/interfaces/keyring/) | resolves the verification key by the envelope's `kid`. |
| `rt?` | [`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |
| `opts?` | \{ `codec?`: [`SealCodec`](/mithril/reference/core/agent/interfaces/sealcodec/); `maxBytes?`: `number`; \} | `codec` must match the sealing codec (default [hmacCodec](/mithril/reference/core/agent/functions/hmaccodec/)); `maxBytes` caps token size (default 4 MiB) as a cheap DoS guard before any crypto runs. |
| `opts.codec?` | [`SealCodec`](/mithril/reference/core/agent/interfaces/sealcodec/) | - |
| `opts.maxBytes?` | `number` | - |

## Returns

`Promise`\<`string`\>

the recovered plaintext body.

## Throws

[StateIntegrityError](/mithril/reference/core/agent/classes/stateintegrityerror/) on oversize input, a malformed 3-part envelope or header, an
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
