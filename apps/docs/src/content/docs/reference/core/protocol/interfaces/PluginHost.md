---
editUrl: false
next: false
prev: false
title: "PluginHost"
---

Defined in: [packages/core/src/protocol/middleware.ts:126](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L126)

The registration surface passed to a [Plugin.setup](/reference/core/protocol/interfaces/plugin/#setup), for contributing plugin fragments.

## Methods

### register()

```ts
register<Deps>(fragment): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:127](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L127)

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
