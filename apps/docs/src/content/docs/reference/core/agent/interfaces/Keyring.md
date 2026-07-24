---
editUrl: false
next: false
prev: false
title: "Keyring"
---

Defined in: [packages/core/src/agent/seal.ts:14](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/seal.ts#L14)

A source of signing/verification keys for sealed tokens, indexed by key id (`kid`).

## Remarks

`current()` supplies the `{ kid, key }` used to sign new tokens ([seal](/mithril/reference/core/agent/functions/seal/)); `resolve(kid)`
picks a (possibly retired) key by the `kid` embedded in a token's envelope, so verification survives
rotation ([open](/mithril/reference/core/agent/functions/open/)). Build a single-key keyring with [singleKeyring](/mithril/reference/core/agent/functions/singlekeyring/).

## Methods

### current()

```ts
current(): Promise<{
  key: CryptoKey;
  kid: string;
}>;
```

Defined in: [packages/core/src/agent/seal.ts:15](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/seal.ts#L15)

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

Defined in: [packages/core/src/agent/seal.ts:16](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/seal.ts#L16)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kid` | `string` |

#### Returns

`Promise`\<`CryptoKey` \| `undefined`\>
