---
editUrl: false
next: false
prev: false
title: "PluginHost"
---

Defined in: packages/core/src/protocol/middleware.ts:126

The registration surface passed to a [Plugin.setup](/reference/core/protocol/interfaces/plugin/#setup), for contributing plugin fragments.

## Methods

### register()

```ts
register<Deps>(fragment): void;
```

Defined in: packages/core/src/protocol/middleware.ts:127

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
