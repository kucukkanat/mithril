---
editUrl: false
next: false
prev: false
title: "ToolProvenance"
---

```ts
type ToolProvenance = 
  | {
  kind: "static";
}
  | {
  kind: "plugin";
  plugin: string;
}
  | {
  kind: "setup";
  plugin: string;
}
  | {
  by: string;
  callId: string;
  kind: "runtime";
};
```

Defined in: [packages/core/src/protocol/tool-registry.ts:16](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L16)

Where a tool in a run's registry came from.

## Union Members

### Type Literal

```ts
{
  kind: "static";
}
```

Declared on `AgentConfig.tools`.

***

### Type Literal

```ts
{
  kind: "plugin";
  plugin: string;
}
```

Contributed by a plugin's static `tools` array.

***

### Type Literal

```ts
{
  kind: "setup";
  plugin: string;
}
```

Registered by a plugin's `setup`, once per run, before step 0.

***

### Type Literal

```ts
{
  by: string;
  callId: string;
  kind: "runtime";
}
```

Defined mid-run by a tool's `execute` via `ctx.tools.register`.
