---
editUrl: false
next: false
prev: false
title: "createHarness"
---

```ts
function createHarness<Deps>(): {
  agent: AgentFactory<Deps>;
  tool: ToolFactory<Deps>;
};
```

Defined in: packages/core/src/agent/factory.ts:338

Bind `Deps` once for a whole app and get back `Deps`-typed [agent](/reference/core/agent/functions/agent/) and [tool](/reference/core/agent/functions/tool/) factories.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the shared dependency object all agents and tools in this harness receive. |

## Returns

```ts
{
  agent: AgentFactory<Deps>;
  tool: ToolFactory<Deps>;
}
```

an object with `agent` ([AgentFactory](/reference/core/agent/interfaces/agentfactory/)) and `tool` ([ToolFactory](/reference/core/agent/interfaces/toolfactory/)), so no
individual definition has to restate `<Deps>()`.

### agent

```ts
readonly agent: AgentFactory<Deps>;
```

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
