---
editUrl: false
next: false
prev: false
title: "singleKeyring"
---

```ts
function singleKeyring(key, kid?): Keyring;
```

Defined in: [packages/core/src/agent/seal.ts:127](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/seal.ts#L127)

The common single-key [Keyring](/reference/core/agent/interfaces/keyring/): signs and verifies with one key under a fixed `kid`.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `key` | `CryptoKey` \| `Promise`\<`CryptoKey`\> | `undefined` | the signing/verification key (or a promise of it). |
| `kid` | `string` | `"k1"` | the key id embedded in the envelope (default `"k1"`). |

## Returns

[`Keyring`](/reference/core/agent/interfaces/keyring/)

a keyring whose `current()` always returns this key and whose `resolve(id)` returns it only for
the matching `kid`. Rotate by composing a keyring whose `current()` is new while `resolve()` retains the old.
