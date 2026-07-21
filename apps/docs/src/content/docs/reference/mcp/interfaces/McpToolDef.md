---
editUrl: false
next: false
prev: false
title: "McpToolDef"
---

Defined in: index.ts:34

An MCP server's description of one tool, as returned by `tools/list`.

## Properties

### description?

```ts
readonly optional description?: string;
```

Defined in: index.ts:38

Human-readable description, if the server provides one.

***

### inputSchema?

```ts
readonly optional inputSchema?: JsonValue;
```

Defined in: index.ts:40

The tool's JSON Schema, kept opaque here (not validated against).

***

### name

```ts
readonly name: string;
```

Defined in: index.ts:36

The tool's unique name, used when calling it.
