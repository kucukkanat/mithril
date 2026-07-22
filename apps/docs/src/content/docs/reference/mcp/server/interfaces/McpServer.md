---
editUrl: false
next: false
prev: false
title: "McpServer"
---

Defined in: [server.ts:18](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/server.ts#L18)

A Mithril-tools-backed MCP server. Create one with [mcpServer](/reference/mcp/server/functions/mcpserver/).

## Methods

### handle()

```ts
handle(request): Promise<JsonValue>;
```

Defined in: [server.ts:20](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/server.ts#L20)

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

Defined in: [server.ts:22](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/mcp/src/server.ts#L22)

Fetch-style handler: read a JSON-RPC request from `request`, dispatch it, and reply with JSON.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | `Request` |

#### Returns

`Promise`\<`Response`\>
