---
editUrl: false
next: false
prev: false
title: "generateStateKey"
---

```ts
function generateStateKey(rt?): Promise<CryptoKey>;
```

Defined in: [packages/core/src/agent/seal.ts:43](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/seal.ts#L43)

Generate an extractable HMAC-SHA-256 signing key for sealing tokens.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rt?` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |

## Returns

`Promise`\<`CryptoKey`\>

a `CryptoKey` usable for `sign`/`verify`, e.g. wrapped in a [singleKeyring](/reference/core/agent/functions/singlekeyring/).

## Throws

[StateIntegrityError](/reference/core/agent/classes/stateintegrityerror/) when `crypto.subtle` is unavailable (insecure context).
