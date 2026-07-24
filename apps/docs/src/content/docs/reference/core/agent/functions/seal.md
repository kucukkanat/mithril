---
editUrl: false
next: false
prev: false
title: "seal"
---

```ts
function seal(
   body, 
   keyring, 
   rt?, 
codec?): Promise<string>;
```

Defined in: [packages/core/src/agent/seal.ts:182](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/seal.ts#L182)

Seal a string into a signed, tamper-evident `header.payload.digest` envelope.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `body` | `string` | the plaintext to protect (e.g. a run resume token from [RunResult](/mithril/reference/core/agent/type-aliases/runresult/)). |
| `keyring` | [`Keyring`](/mithril/reference/core/agent/interfaces/keyring/) | supplies the current signing key and its `kid`. |
| `rt?` | [`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |
| `codec?` | [`SealCodec`](/mithril/reference/core/agent/interfaces/sealcodec/) | the payload [SealCodec](/mithril/reference/core/agent/interfaces/sealcodec/); defaults to [hmacCodec](/mithril/reference/core/agent/functions/hmaccodec/) (integrity-only). |

## Returns

`Promise`\<`string`\>

the sealed token string. The HMAC digest covers `header + "." + payload`, so `kid`/codec are
readable and tamper-evident before verification.

## Throws

[StateIntegrityError](/mithril/reference/core/agent/classes/stateintegrityerror/) when `crypto.subtle` is unavailable (insecure context).

## Example

```ts
import { seal, open, singleKeyring, generateStateKey } from "@mithril/core/agent";

const keyring = singleKeyring(await generateStateKey());
const token = await seal(runResult.token, keyring); // runResult.status === "suspended"
// …persist `token`; later, verify + recover the original body:
const body = await open(token, keyring);
```
