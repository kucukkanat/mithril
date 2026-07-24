---
editUrl: false
next: false
prev: false
title: "providerImportEntries"
---

```ts
function providerImportEntries(providers): Map<string, readonly string[]>;
```

Defined in: [packages/spec/src/codegen.ts:52](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/codegen.ts#L52)

Map a set of provider tokens to their `{ module → named imports }` entries — the provider half of an import plan.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `providers` | `ReadonlySet`\<`string`\> |

## Returns

`Map`\<`string`, readonly `string`[]\>
