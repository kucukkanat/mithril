---
editUrl: false
next: false
prev: false
title: "PluginSetup"
---

Defined in: [packages/core/src/protocol/middleware.ts:233](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L233)

A [Plugin.setup](/mithril/reference/core/protocol/interfaces/plugin/#setup) paired with its plugin's name, as collected from an agent's `use` array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Properties

### plugin

```ts
readonly plugin: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:234](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L234)

***

### run

```ts
readonly run: (host) => void | Promise<void>;
```

Defined in: [packages/core/src/protocol/middleware.ts:235](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L235)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `host` | [`PluginHost`](/mithril/reference/core/protocol/interfaces/pluginhost/)\<`Deps`\> |

#### Returns

`void` \| `Promise`\<`void`\>
