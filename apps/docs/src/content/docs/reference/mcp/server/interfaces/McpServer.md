---
editUrl: false
next: false
prev: false
title: "McpServer"
---

Defined in: [packages/mcp/src/server.ts:20](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/server.ts#L20)

A Mithril-tools-backed MCP server. Create one with [mcpServer](/mithril/reference/mcp/server/functions/mcpserver/).

## Methods

### handle()

```ts
handle(request): Promise<JsonValue>;
```

Defined in: [packages/mcp/src/server.ts:22](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/server.ts#L22)

Dispatch one JSON-RPC request object and resolve its JSON-RPC response.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>

***

### serve()

```ts
serve(request): Promise<Response>;
```

Defined in: [packages/mcp/src/server.ts:24](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/server.ts#L24)

Fetch-style handler: read a JSON-RPC request from `request`, dispatch it, and reply with JSON.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | `Request` |

#### Returns

`Promise`\<`Response`\>
