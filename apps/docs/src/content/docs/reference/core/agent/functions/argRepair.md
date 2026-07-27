---
editUrl: false
next: false
prev: false
title: "argRepair"
---

```ts
function argRepair<Deps>(): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:154](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/healing.ts#L154)

Tool-altitude repair: when a tool call fails schema validation because the model emitted the whole
arguments object as a JSON string (a common small-model slip), coerce it to the object, emit a visible
`tool.repair`, and re-run the call once. Any non-`invalid_args` failure, or an uncoercible input, is
left untouched for the model to see.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred; healing middleware are dependency-agnostic). |

## Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
