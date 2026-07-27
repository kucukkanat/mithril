---
editUrl: false
next: false
prev: false
title: "Plugin"
---

Defined in: [packages/core/src/protocol/middleware.ts:249](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L249)

A bundle of tools, middleware, and event consumers registered as a unit.

## Remarks

`Tools` is carried (with a phantom `__tools` field, erased at build) so plugin
tool types survive inference. `const` is applied at the `plugin()` factory's
call signature, not here — it is invalid on an interface type parameter.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | The dependency bag the plugin's tools and middleware require. |
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | The plugin's tool tuple, preserved so [InferPluginTools](/mithril/reference/core/protocol/type-aliases/inferplugintools/) can recover names/inputs. |

## Properties

### \_\_tools?

```ts
readonly optional __tools?: Tools;
```

Defined in: [packages/core/src/protocol/middleware.ts:272](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L272)

Phantom carrier for `Tools` inference; erased at build.

***

### consumers?

```ts
readonly optional consumers?: readonly EventConsumer[];
```

Defined in: [packages/core/src/protocol/middleware.ts:253](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L253)

***

### materialize?

```ts
readonly optional materialize?: (def) => AnyTool<Deps>;
```

Defined in: [packages/core/src/protocol/middleware.ts:270](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L270)

Rebuilds a runtime tool from its replayable [ToolDefinition](/mithril/reference/core/protocol/interfaces/tooldefinition/), on resume.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `def` | [`ToolDefinition`](/mithril/reference/core/protocol/interfaces/tooldefinition/) |

#### Returns

[`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>

#### Remarks

Core stores definitions but never interprets their `body`; the package that defines a body
format supplies this. At most one plugin in an agent may declare it.

***

### middleware?

```ts
readonly optional middleware?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/protocol/middleware.ts:252](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L252)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:250](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L250)

***

### setup?

```ts
readonly optional setup?: (host) => void | Promise<void>;
```

Defined in: [packages/core/src/protocol/middleware.ts:263](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L263)

Run-time contribution hook, invoked once per run before step 0 (and again on each `resume`, so it must
be idempotent). Use it for capabilities that cannot be known statically — tools loaded from a store,
discovered from a server, or derived from `deps`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `host` | [`PluginHost`](/mithril/reference/core/protocol/interfaces/pluginhost/)\<`Deps`\> |

#### Returns

`void` \| `Promise`\<`void`\>

#### Remarks

Setups run sequentially in `use` order, so a later plugin may build on an earlier one's tools.
A setup that throws fails the run: a plugin that cannot install its capabilities has not "partly"
worked, and continuing would silently run an agent with fewer tools than its author declared.

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/protocol/middleware.ts:251](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L251)
