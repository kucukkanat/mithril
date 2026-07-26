---
editUrl: false
next: false
prev: false
title: "McpToolDef"
---

Defined in: [packages/mcp/src/index.ts:85](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L85)

An MCP server's description of one tool, as returned by `tools/list`.

## Properties

### description?

```ts
readonly optional description?: string;
```

Defined in: [packages/mcp/src/index.ts:89](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L89)

Human-readable description, if the server provides one.

***

### inputSchema?

```ts
readonly optional inputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:91](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L91)

The tool's JSON Schema, kept opaque here (not validated against).

***

### name

```ts
readonly name: string;
```

Defined in: [packages/mcp/src/index.ts:87](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L87)

The tool's unique name, used when calling it.

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:93](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L93)

The tool's result JSON Schema, if the server advertises one (present ⇒ expect `structuredContent`).
