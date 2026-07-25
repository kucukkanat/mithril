---
editUrl: false
next: false
prev: false
title: "McpToolDef"
---

Defined in: [packages/mcp/src/index.ts:79](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L79)

An MCP server's description of one tool, as returned by `tools/list`.

## Properties

### description?

```ts
readonly optional description?: string;
```

Defined in: [packages/mcp/src/index.ts:83](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L83)

Human-readable description, if the server provides one.

***

### inputSchema?

```ts
readonly optional inputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:85](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L85)

The tool's JSON Schema, kept opaque here (not validated against).

***

### name

```ts
readonly name: string;
```

Defined in: [packages/mcp/src/index.ts:81](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L81)

The tool's unique name, used when calling it.

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:87](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L87)

The tool's result JSON Schema, if the server advertises one (present ⇒ expect `structuredContent`).
