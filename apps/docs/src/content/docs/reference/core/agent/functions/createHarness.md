---
editUrl: false
next: false
prev: false
title: "createHarness"
---

```ts
function createHarness<Deps>(): {
  agent: AgentFactory<Deps>;
  plugin: <Tools>(p) => Plugin<Deps, Tools>;
  tool: ToolFactory<Deps>;
};
```

Defined in: [packages/core/src/agent/factory.ts:348](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/factory.ts#L348)

Bind `Deps` once for a whole app and get back `Deps`-typed [agent](/reference/core/agent/functions/agent/) and [tool](/reference/core/agent/functions/tool/) factories.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the shared dependency object all agents and tools in this harness receive. |

## Returns

```ts
{
  agent: AgentFactory<Deps>;
  plugin: <Tools>(p) => Plugin<Deps, Tools>;
  tool: ToolFactory<Deps>;
}
```

an object with `agent` ([AgentFactory](/reference/core/agent/interfaces/agentfactory/)), `tool` ([ToolFactory](/reference/core/agent/interfaces/toolfactory/)), and `plugin`
(a `Deps`-bound [plugin](/reference/core/agent/functions/plugin/) factory), so no individual definition has to restate `<Deps>()`.

### agent

```ts
readonly agent: AgentFactory<Deps>;
```

### plugin

```ts
readonly plugin: <Tools>(p) => Plugin<Deps, Tools>;
```

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | \[\] |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `p` | [`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`Deps`, `Tools`\> |

#### Returns

[`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`Deps`, `Tools`\>

### tool

```ts
readonly tool: ToolFactory<Deps>;
```

## Example

```ts
import { createHarness } from "@mithril/core/agent";

type Deps = { readonly db: Database };
const { agent, tool } = createHarness<Deps>();

const lookup = tool({
  name: "lookup_user",
  description: "Fetch a user by id.",
  inputSchema: z.object({ id: z.string() }),
  async execute({ id }, ctx) {
    return ctx.deps.db.users.get(id);
  },
});

const app = agent({ model: "anthropic/claude-sonnet-4", instructions: "…", tools: [lookup] });
await app.run("Who is user 42?", { deps: { db } });
```
