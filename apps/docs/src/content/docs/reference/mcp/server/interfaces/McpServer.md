---
editUrl: false
next: false
prev: false
title: "McpServer"
---

Defined in: [packages/mcp/src/server.ts:20](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/server.ts#L20)

A Mithril-tools-backed MCP server. Create one with [mcpServer](/mithril/reference/mcp/server/functions/mcpserver/).

## Methods

### handle()

```ts
handle(request, signal?): Promise<JsonValue>;
```

Defined in: [packages/mcp/src/server.ts:27](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/server.ts#L27)

Dispatch one JSON-RPC request object and resolve its JSON-RPC response.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `request` | `JsonValue` | - |
| `signal?` | `AbortSignal` | aborts the tool invocation this request triggers; `serve` passes the HTTP request's own signal, so a client that disconnects cancels the work it asked for. |

#### Returns

`Promise`\<`JsonValue`\>

***

### serve()

```ts
serve(request): Promise<Response>;
```

Defined in: [packages/mcp/src/server.ts:29](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/server.ts#L29)

Fetch-style handler: read a JSON-RPC request from `request`, dispatch it, and reply with JSON.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | `Request` |

#### Returns

`Promise`\<`Response`\>
