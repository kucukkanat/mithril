---
editUrl: false
next: false
prev: false
title: "Keyring"
---

Defined in: packages/core/src/agent/seal.ts:14

A source of signing/verification keys for sealed tokens, indexed by key id (`kid`).

## Remarks

`current()` supplies the `{ kid, key }` used to sign new tokens ([seal](/reference/core/agent/functions/seal/)); `resolve(kid)`
picks a (possibly retired) key by the `kid` embedded in a token's envelope, so verification survives
rotation ([open](/reference/core/agent/functions/open/)). Build a single-key keyring with [singleKeyring](/reference/core/agent/functions/singlekeyring/).

## Methods

### current()

```ts
current(): Promise<{
  key: CryptoKey;
  kid: string;
}>;
```

Defined in: packages/core/src/agent/seal.ts:15

#### Returns

`Promise`\<\{
  `key`: `CryptoKey`;
  `kid`: `string`;
\}\>

***

### resolve()

```ts
resolve(kid): Promise<CryptoKey | undefined>;
```

Defined in: packages/core/src/agent/seal.ts:16

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kid` | `string` |

#### Returns

`Promise`\<`CryptoKey` \| `undefined`\>
