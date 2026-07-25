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

Defined in: [packages/core/src/agent/factory.ts:423](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/agent/factory.ts#L423)

Bind `Deps` once for a whole app and get back `Deps`-typed [agent](/mithril/reference/core/agent/functions/agent/) and [tool](/mithril/reference/core/agent/functions/tool/) factories.

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

an object with `agent` ([AgentFactory](/mithril/reference/core/agent/interfaces/agentfactory/)), `tool` ([ToolFactory](/mithril/reference/core/agent/interfaces/toolfactory/)), and `plugin`
(a `Deps`-bound [plugin](/mithril/reference/core/agent/functions/plugin/) factory), so no individual definition has to restate `<Deps>()`.

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
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | \[\] |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `p` | [`Plugin`](/mithril/reference/core/protocol/interfaces/plugin/)\<`Deps`, `Tools`\> |

#### Returns

[`Plugin`](/mithril/reference/core/protocol/interfaces/plugin/)\<`Deps`, `Tools`\>

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
