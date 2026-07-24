---
editUrl: false
next: false
prev: false
title: "AsToolOptions"
---

Defined in: [packages/core/src/agent/factory.ts:455](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L455)

Options for [asTool](/mithril/reference/core/agent/functions/astool/): how a sub-agent is exposed as a callable tool.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `In` | the tool's validated input type (defaults to `{ task: string }`). |
| `ChildDeps` | the sub-agent's dependency type, provided per call via [AsToolOptions.deps](/mithril/reference/core/agent/interfaces/astooloptions/#deps). |

## Properties

### deps?

```ts
readonly optional deps?: (ctx) => ChildDeps;
```

Defined in: [packages/core/src/agent/factory.ts:464](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L464)

Provide the sub-agent's dependencies from the calling tool's [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`RunContext`](/mithril/reference/core/protocol/interfaces/runcontext/)\<`unknown`\> |

#### Returns

`ChildDeps`

***

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/agent/factory.ts:457](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L457)

***

### input?

```ts
readonly optional input?: (input) => Input;
```

Defined in: [packages/core/src/agent/factory.ts:462](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L462)

Map the validated tool input to the sub-agent's run input; defaults to `input.task` (or the raw string).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `In` |

#### Returns

[`Input`](/mithril/reference/core/agent/type-aliases/input/)

***

### inputSchema?

```ts
readonly optional inputSchema?: StandardSchemaV1<unknown, In>;
```

Defined in: [packages/core/src/agent/factory.ts:460](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L460)

Input schema; defaults to `{ task: string }`. Supply [AsToolOptions.input](/mithril/reference/core/agent/interfaces/astooloptions/#input) when you change it.

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/agent/factory.ts:456](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L456)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean;
```

Defined in: [packages/core/src/agent/factory.ts:466](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L466)

Gate the sub-agent call behind Tier-1 approval.

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/agent/factory.ts:458](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L458)
