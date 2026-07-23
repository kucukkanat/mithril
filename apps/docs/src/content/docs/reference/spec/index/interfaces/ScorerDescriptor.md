---
editUrl: false
next: false
prev: false
title: "ScorerDescriptor"
---

Defined in: packages/spec/src/scorers.ts:39

A catalog entry: everything needed to render a scorer's form AND emit its `@mithril/evals` call.

## Properties

### emit

```ts
readonly emit: (params, ctx) => string;
```

Defined in: packages/spec/src/scorers.ts:50

Emit the scorer call source-expression, e.g. `calledTool("weather")`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `Readonly`\<`Record`\<`string`, `unknown`\>\> |
| `ctx` | [`ScorerEmitContext`](/reference/spec/index/interfaces/scoreremitcontext/) |

#### Returns

`string`

***

### imports

```ts
readonly imports: readonly string[];
```

Defined in: packages/spec/src/scorers.ts:46

Named imports this scorer needs from `@mithril/evals`.

***

### label

```ts
readonly label: string;
```

Defined in: packages/spec/src/scorers.ts:42

***

### live?

```ts
readonly optional live?: boolean;
```

Defined in: packages/spec/src/scorers.ts:48

`true` when the scorer makes a real model call (gates opt-in in the UI).

***

### params

```ts
readonly params: readonly ScorerParamField[];
```

Defined in: packages/spec/src/scorers.ts:44

***

### summary

```ts
readonly summary: string;
```

Defined in: packages/spec/src/scorers.ts:43

***

### type

```ts
readonly type: string;
```

Defined in: packages/spec/src/scorers.ts:41

Matches [ScorerSpec.type](/reference/spec/index/interfaces/scorerspec/#type).
