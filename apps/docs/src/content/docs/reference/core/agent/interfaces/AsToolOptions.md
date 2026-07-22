---
editUrl: false
next: false
prev: false
title: "AsToolOptions"
---

Defined in: [packages/core/src/agent/factory.ts:375](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L375)

Options for [asTool](/reference/core/agent/functions/astool/): how a sub-agent is exposed as a callable tool.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `In` | the tool's validated input type (defaults to `{ task: string }`). |
| `ChildDeps` | the sub-agent's dependency type, provided per call via [AsToolOptions.deps](/reference/core/agent/interfaces/astooloptions/#deps). |

## Properties

### deps?

```ts
readonly optional deps?: (ctx) => ChildDeps;
```

Defined in: [packages/core/src/agent/factory.ts:384](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L384)

Provide the sub-agent's dependencies from the calling tool's [RunContext](/reference/core/protocol/interfaces/runcontext/).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`RunContext`](/reference/core/protocol/interfaces/runcontext/)\<`unknown`\> |

#### Returns

`ChildDeps`

***

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/agent/factory.ts:377](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L377)

***

### input?

```ts
readonly optional input?: (input) => Input;
```

Defined in: [packages/core/src/agent/factory.ts:382](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L382)

Map the validated tool input to the sub-agent's run input; defaults to `input.task` (or the raw string).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `In` |

#### Returns

[`Input`](/reference/core/agent/type-aliases/input/)

***

### inputSchema?

```ts
readonly optional inputSchema?: StandardSchemaV1<unknown, In>;
```

Defined in: [packages/core/src/agent/factory.ts:380](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L380)

Input schema; defaults to `{ task: string }`. Supply [AsToolOptions.input](/reference/core/agent/interfaces/astooloptions/#input) when you change it.

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/agent/factory.ts:376](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L376)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean;
```

Defined in: [packages/core/src/agent/factory.ts:386](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L386)

Gate the sub-agent call behind Tier-1 approval.

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/agent/factory.ts:378](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/factory.ts#L378)
