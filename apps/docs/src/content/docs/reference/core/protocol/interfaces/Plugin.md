---
editUrl: false
next: false
prev: false
title: "Plugin"
---

Defined in: [packages/core/src/protocol/middleware.ts:217](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L217)

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

Defined in: [packages/core/src/protocol/middleware.ts:224](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L224)

Phantom carrier for `Tools` inference; erased at build.

***

### consumers?

```ts
readonly optional consumers?: readonly EventConsumer[];
```

Defined in: [packages/core/src/protocol/middleware.ts:221](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L221)

***

### middleware?

```ts
readonly optional middleware?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/protocol/middleware.ts:220](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L220)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:218](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L218)

***

### setup?

```ts
readonly optional setup?: (host) => void | Promise<void>;
```

Defined in: [packages/core/src/protocol/middleware.ts:222](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L222)

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

Defined in: [packages/core/src/protocol/middleware.ts:219](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L219)
