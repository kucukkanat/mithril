---
editUrl: false
next: false
prev: false
title: "agent"
---

## Call Signature

```ts
function agent<Deps>(): AgentFactory<Deps>;
```

Defined in: [packages/core/src/agent/factory.ts:310](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/agent/factory.ts#L310)

Build a runnable [Agent](/reference/core/agent/interfaces/agent/) from an [AgentConfig](/reference/core/agent/interfaces/agentconfig/), or curry over `Deps` first.

### Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

### Returns

[`AgentFactory`](/reference/core/agent/interfaces/agentfactory/)\<`Deps`\>

the built [Agent](/reference/core/agent/interfaces/agent/), or an [AgentFactory](/reference/core/agent/interfaces/agentfactory/) when called with no arguments.

### Remarks

Two forms:
- `agent<Deps>()` returns an [AgentFactory](/reference/core/agent/interfaces/agentfactory/) that binds `Deps` for the config.
- `agent(config)` builds a no-deps agent (`Deps = void`) directly.

`Tools` and `Out` are inferred from the config, so tool typings and the structured-output type flow
through to [RunResult](/reference/core/agent/type-aliases/runresult/).

### Example

```ts
import { agent, tool } from "@mithril/core/agent";
import { z } from "zod";

const assistant = agent({
  model: "anthropic/claude-sonnet-4",
  instructions: "You are a concise assistant.",
  tools: [
    tool({
      name: "add",
      description: "Add two numbers.",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      async execute({ a, b }) {
        return a + b;
      },
    }),
  ],
});

const result = await assistant.run("What is 2 + 2?");
if (result.status === "completed") console.log(result.output);
```

## Call Signature

```ts
function agent<Tools, Out>(config): Agent<Tools, void, Out>;
```

Defined in: [packages/core/src/agent/factory.ts:311](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/agent/factory.ts#L311)

Build a runnable [Agent](/reference/core/agent/interfaces/agent/) from an [AgentConfig](/reference/core/agent/interfaces/agentconfig/), or curry over `Deps` first.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`void`\>[] | \[\] |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`AgentConfig`](/reference/core/agent/interfaces/agentconfig/)\<`Tools`, `void`, `Out`\> | the [AgentConfig](/reference/core/agent/interfaces/agentconfig/), omitted in the curried form. |

### Returns

[`Agent`](/reference/core/agent/interfaces/agent/)\<`Tools`, `void`, `Out`\>

the built [Agent](/reference/core/agent/interfaces/agent/), or an [AgentFactory](/reference/core/agent/interfaces/agentfactory/) when called with no arguments.

### Remarks

Two forms:
- `agent<Deps>()` returns an [AgentFactory](/reference/core/agent/interfaces/agentfactory/) that binds `Deps` for the config.
- `agent(config)` builds a no-deps agent (`Deps = void`) directly.

`Tools` and `Out` are inferred from the config, so tool typings and the structured-output type flow
through to [RunResult](/reference/core/agent/type-aliases/runresult/).

### Example

```ts
import { agent, tool } from "@mithril/core/agent";
import { z } from "zod";

const assistant = agent({
  model: "anthropic/claude-sonnet-4",
  instructions: "You are a concise assistant.",
  tools: [
    tool({
      name: "add",
      description: "Add two numbers.",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      async execute({ a, b }) {
        return a + b;
      },
    }),
  ],
});

const result = await assistant.run("What is 2 + 2?");
if (result.status === "completed") console.log(result.output);
```
