---
editUrl: false
next: false
prev: false
title: "providerImportEntries"
---

```ts
function providerImportEntries(providers): Map<string, readonly string[]>;
```

Defined in: [packages/spec/src/codegen.ts:53](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/codegen.ts#L53)

Map a set of provider tokens to their `{ module → named imports }` entries — the provider half of an import plan.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `providers` | `ReadonlySet`\<`string`\> |

## Returns

`Map`\<`string`, readonly `string`[]\>
