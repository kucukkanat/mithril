---
editUrl: false
next: false
prev: false
title: "McpToolDef"
---

Defined in: [packages/mcp/src/index.ts:78](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L78)

An MCP server's description of one tool, as returned by `tools/list`.

## Properties

### description?

```ts
readonly optional description?: string;
```

Defined in: [packages/mcp/src/index.ts:82](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L82)

Human-readable description, if the server provides one.

***

### inputSchema?

```ts
readonly optional inputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:84](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L84)

The tool's JSON Schema, kept opaque here (not validated against).

***

### name

```ts
readonly name: string;
```

Defined in: [packages/mcp/src/index.ts:80](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L80)

The tool's unique name, used when calling it.

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:86](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L86)

The tool's result JSON Schema, if the server advertises one (present ⇒ expect `structuredContent`).
