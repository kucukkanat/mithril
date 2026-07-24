---
editUrl: false
next: false
prev: false
title: "PluginHost"
---

Defined in: [packages/core/src/protocol/middleware.ts:202](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L202)

The registration surface passed to a [Plugin.setup](/mithril/reference/core/protocol/interfaces/plugin/#setup), for contributing plugin fragments.

## Methods

### register()

```ts
register<Deps>(fragment): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:203](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L203)

#### Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fragment` | `Partial`\<[`Plugin`](/mithril/reference/core/protocol/interfaces/plugin/)\<`Deps`\>\> |

#### Returns

`void`
