---
editUrl: false
next: false
prev: false
title: "AsToolOptions"
---

Defined in: [packages/core/src/agent/factory.ts:496](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L496)

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

Defined in: [packages/core/src/agent/factory.ts:505](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L505)

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

Defined in: [packages/core/src/agent/factory.ts:498](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L498)

***

### input?

```ts
readonly optional input?: (input) => Input;
```

Defined in: [packages/core/src/agent/factory.ts:503](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L503)

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

Defined in: [packages/core/src/agent/factory.ts:501](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L501)

Input schema; defaults to `{ task: string }`. Supply [AsToolOptions.input](/mithril/reference/core/agent/interfaces/astooloptions/#input) when you change it.

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/agent/factory.ts:497](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L497)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean;
```

Defined in: [packages/core/src/agent/factory.ts:507](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L507)

Gate the sub-agent call behind Tier-1 approval.

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/agent/factory.ts:499](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/factory.ts#L499)
