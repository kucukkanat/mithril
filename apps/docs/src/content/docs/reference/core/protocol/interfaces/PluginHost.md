---
editUrl: false
next: false
prev: false
title: "PluginHost"
---

Defined in: [packages/core/src/protocol/middleware.ts:202](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/middleware.ts#L202)

The registration surface passed to a [Plugin.setup](/reference/core/protocol/interfaces/plugin/#setup), for contributing plugin fragments.

## Methods

### register()

```ts
register<Deps>(fragment): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:203](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/middleware.ts#L203)

#### Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fragment` | `Partial`\<[`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`Deps`\>\> |

#### Returns

`void`
