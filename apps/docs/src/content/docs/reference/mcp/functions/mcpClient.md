---
editUrl: false
next: false
prev: false
title: "mcpClient"
---

```ts
function mcpClient(transport): McpClient;
```

Defined in: index.ts:71

Create an [McpClient](/reference/mcp/interfaces/mcpclient/) over a caller-supplied [McpTransport](/reference/mcp/interfaces/mcptransport/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `transport` | [`McpTransport`](/reference/mcp/interfaces/mcptransport/) | Your transport implementation (HTTP/SSE, stdio, or in-memory). |

## Returns

[`McpClient`](/reference/mcp/interfaces/mcpclient/)

A client that can list and call the server's tools.

## Example

```ts
import { mcpClient, mcpTools, type McpTransport } from "@mithril/mcp";

// You implement the transport — this package ships none.
const transport: McpTransport = {
  request: (method, params) => rpc.send(method, params),
};

const client = mcpClient(transport);
const tools = await mcpTools(client); // hand these to an agent
```
