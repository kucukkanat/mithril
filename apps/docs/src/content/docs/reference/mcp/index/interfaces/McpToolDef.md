---
editUrl: false
next: false
prev: false
title: "McpToolDef"
---

Defined in: [index.ts:35](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/index.ts#L35)

An MCP server's description of one tool, as returned by `tools/list`.

## Properties

### description?

```ts
readonly optional description?: string;
```

Defined in: [index.ts:39](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/index.ts#L39)

Human-readable description, if the server provides one.

***

### inputSchema?

```ts
readonly optional inputSchema?: JsonValue;
```

Defined in: [index.ts:41](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/index.ts#L41)

The tool's JSON Schema, kept opaque here (not validated against).

***

### name

```ts
readonly name: string;
```

Defined in: [index.ts:37](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/index.ts#L37)

The tool's unique name, used when calling it.
