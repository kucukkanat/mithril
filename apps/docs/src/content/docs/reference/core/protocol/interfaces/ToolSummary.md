---
editUrl: false
next: false
prev: false
title: "ToolSummary"
---

Defined in: packages/core/src/protocol/tool-registry.ts:57

The non-executable view of a registered tool — safe to hand to an observer or back to the model.

## Properties

### definition?

```ts
readonly optional definition?: ToolDefinition;
```

Defined in: packages/core/src/protocol/tool-registry.ts:63

Present only for tools registered from a definition (`setup` and `runtime` provenance).

***

### description

```ts
readonly description: string;
```

Defined in: packages/core/src/protocol/tool-registry.ts:59

***

### name

```ts
readonly name: string;
```

Defined in: packages/core/src/protocol/tool-registry.ts:58

***

### provenance

```ts
readonly provenance: ToolProvenance;
```

Defined in: packages/core/src/protocol/tool-registry.ts:61

***

### version?

```ts
readonly optional version?: string;
```

Defined in: packages/core/src/protocol/tool-registry.ts:60
