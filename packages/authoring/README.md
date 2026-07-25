# @mithril/authoring

**The agent writes its own tools.** Mid-run, it defines a new named, schema'd, callable tool — and uses it
for the rest of the run.

```sh
bun add @mithril/authoring
```

## Quick start

```ts
import { agent } from "@mithril/core/agent";
import { toolAuthoring } from "@mithril/authoring";

const a = agent({
  model: "anthropic/claude-sonnet-5",
  instructions: "Build the tools you need from the ones you have.",
  tools: [getWeather, celsiusToFahrenheit],
  use: [toolAuthoring()],
});

const result = await a.run("What's the weather in Oslo, in Fahrenheit?");
if (result.status === "suspended") {
  // define_tool is approval-gated: a human sees the whole definition before the capability exists.
  console.log(result.request.payload);
  await a.resume(result.token, { kind: "approve" });
}
```

The agent gains three meta-tools: **`define_tool`**, **`list_tools`** and **`revoke_tool`**.

## How the model knows what to write

There is **no extra inference pass and no code-generation step**. `define_tool` is an ordinary tool; the
model emits an ordinary tool call whose *arguments are the tool definition*. It learns the format from
three mechanisms that already exist:

1. `define_tool`'s own input schema, advertised as JSON Schema — the schema *is* the specification.
2. Its `examples`, which the loop folds into the wire description for every provider (free few-shot).
3. `list_tools`, so it knows what it can compose against.

The model never sees Mithril's API — no `tool()`, no `StandardSchemaV1`, no `RunContext`. It emits JSON.

## Tier 1 — composition (the default)

A composed tool is a **linear pipeline over tools the agent already has**:

```ts
{
  name: "weather_f",
  description: "Look up a city's weather in Fahrenheit.",
  inputSchema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] },
  body: {
    kind: "composition",
    steps: [
      { id: "w", tool: "get_weather", args: { city: { from: "input", path: "city" } } },
      { id: "f", tool: "c_to_f",      args: { celsius: { from: "step", id: "w", path: "tempC" } } },
    ],
  },
}
```

An argument is `{ from: "input", path }`, `{ from: "step", id, path }`, or `{ value }`. `path` is dotted,
with numeric segments for arrays (`"results.0.id"`).

**Why this is the safe default.** A composition can only reference tools that are *already registered*, so
it rearranges the agent's existing capabilities and can never exceed them. And a composed tool inherits an
approval gate from any tool it calls — otherwise wrapping `deploy` in `do_the_thing` would make the gate
vanish.

**Deliberate limits:** linear only — no branching, loops, arithmetic or string manipulation. The moment
`args` accepts `{"$concat": [...]}` you own an interpreter and its security surface. When a pipeline is not
enough, the answer is Tier 2.

Each step emits a `tool.progress` event, and the sub-calls share the parent's `RunContext`, so a composed
tool gets human-in-the-loop and cancellation for free — and `ctx.journal` makes a mid-composition
suspension exactly-once.

## Timing: defined now, callable next turn

The loop snapshots the registry **once per step** and hands the identical array to both the model call and
tool dispatch, so the tools the model is offered are exactly the tools that can dispatch. A tool defined
during step N therefore becomes callable at step N+1 — `define_tool` returns `availableFromStep` so the
model knows.

## Approval

`define_tool` is `needsApproval: true` by default. One gate at definition, where a human sees the name,
the schema and the whole body; the generated tool then runs freely.

```ts
toolAuthoring({ requireApprovalToDefine: false }) // trusted pipelines only — see below
```

## What this does *not* protect you from

Stated plainly, because the guarantees only hold where they hold:

- An operator who sets `requireApprovalToDefine: false`, or an approver who rubber-stamps the definition.
- **Novel combinations of existing authorities.** Composition is authority-*preserving*, not
  authority-*reducing*. If the agent already has `read_customer_record` and `post_to_slack` — both
  individually ungated — it can compose `leak_customer`. The fix is gating the dangerous primitives; that
  is a property of your tool set, not something authoring can add.

What *is* mechanical: a composition cannot reference a tool the agent lacks; approval inheritance blocks
laundering; names are never shadowed (redefining `send_email` is refused, not silently accepted); and a
tool the agent authored can be revoked, while one its author declared cannot.

## Budget

Every registered tool costs tokens on **every** step, so `maxTools` defaults to 16 and `revoke_tool` is how
the agent makes room.

```ts
toolAuthoring({ maxTools: 8 })
```

## Runtimes

Browser, Node and Bun. Tier-1 composition is pure data interpretation — no `eval`, no builtins — so it runs
everywhere identically, and the repo's `check:browser-safe` gate verifies the entrypoint.

## Persistence across runs

Authored tools are ephemeral by default: they live for one run, and ride the suspension token so a
cross-process `resume()` rebuilds them. The plugin declares `materialize`, which is what the loop uses to
turn a stored definition back into a callable tool.

## API

| Export | What it is |
| --- | --- |
| `toolAuthoring(opts?)` | The plugin. Add to an agent's `use`. |
| `AuthoringOptions` | `requireApprovalToDefine`, `maxTools`, `materializers`. |
| `ToolComposition`, `CompositionStep`, `ValueRef` | The Tier-1 body types. |
| `validateComposition`, `inheritsApproval`, `resolveRef`, `isComposition` | Composition internals, exported for tests and custom tiers. |
| `buildDefinition`, `defineToolSchema` | Definition construction and validation. |
| `materialize`, `Materializers` | `ToolDefinition` → callable tool; the seam additional body kinds plug into. |
