---
editUrl: false
next: false
prev: false
title: "ToolStoreTestAdapter"
---

Defined in: [persistence.ts:127](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/persistence.ts#L127)

Bridges [toolStoreConformance](/mithril/reference/authoring/persistence/functions/toolstoreconformance/) to a host test runner.

## Methods

### assertEqual()

```ts
assertEqual(actual, expected): void;
```

Defined in: [persistence.ts:129](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/persistence.ts#L129)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `actual` | `unknown` |
| `expected` | `unknown` |

#### Returns

`void`

***

### test()

```ts
test(name, fn): void;
```

Defined in: [persistence.ts:128](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/persistence.ts#L128)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
