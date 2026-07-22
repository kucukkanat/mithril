---
editUrl: false
next: false
prev: false
title: "Plugin"
---

Defined in: [packages/core/src/protocol/middleware.ts:141](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L141)

A bundle of tools, middleware, and event consumers registered as a unit.

## Remarks

`Tools` is carried (with a phantom `__tools` field, erased at build) so plugin
tool types survive inference. `const` is applied at the `plugin()` factory's
call signature, not here — it is invalid on an interface type parameter.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | The dependency bag the plugin's tools and middleware require. |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | The plugin's tool tuple, preserved so [InferPluginTools](/reference/core/protocol/type-aliases/inferplugintools/) can recover names/inputs. |

## Properties

### \_\_tools?

```ts
readonly optional __tools?: Tools;
```

Defined in: [packages/core/src/protocol/middleware.ts:148](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L148)

Phantom carrier for `Tools` inference; erased at build.

***

### consumers?

```ts
readonly optional consumers?: readonly EventConsumer[];
```

Defined in: [packages/core/src/protocol/middleware.ts:145](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L145)

***

### middleware?

```ts
readonly optional middleware?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/protocol/middleware.ts:144](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L144)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:142](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L142)

***

### setup?

```ts
readonly optional setup?: (host) => void | Promise<void>;
```

Defined in: [packages/core/src/protocol/middleware.ts:146](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L146)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `host` | [`PluginHost`](/reference/core/protocol/interfaces/pluginhost/) |

#### Returns

`void` \| `Promise`\<`void`\>

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/protocol/middleware.ts:143](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L143)
