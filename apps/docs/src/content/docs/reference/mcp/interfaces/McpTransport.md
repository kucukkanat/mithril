---
editUrl: false
next: false
prev: false
title: "McpTransport"
---

Defined in: index.ts:26

The transport you implement to carry MCP JSON-RPC calls to a server.

## Remarks

This package provides no concrete transport — implement this interface over HTTP/SSE, stdio, or an
in-memory server (which is how the client is tested). Passed to [mcpClient](/reference/mcp/functions/mcpclient/).

## Methods

### close()?

```ts
optional close(): Promise<void>;
```

Defined in: index.ts:30

Optional teardown, invoked by [McpClient.close](/reference/mcp/interfaces/mcpclient/#close).

#### Returns

`Promise`\<`void`\>

***

### request()

```ts
request(method, params): Promise<JsonValue>;
```

Defined in: index.ts:28

Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>
