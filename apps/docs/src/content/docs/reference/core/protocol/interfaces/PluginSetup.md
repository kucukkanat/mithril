---
editUrl: false
next: false
prev: false
title: "PluginSetup"
---

Defined in: [packages/core/src/protocol/middleware.ts:233](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L233)

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

Defined in: [packages/core/src/protocol/middleware.ts:234](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L234)

***

### run

```ts
readonly run: (host) => void | Promise<void>;
```

Defined in: [packages/core/src/protocol/middleware.ts:235](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L235)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `host` | [`PluginHost`](/mithril/reference/core/protocol/interfaces/pluginhost/)\<`Deps`\> |

#### Returns

`void` \| `Promise`\<`void`\>
