---
editUrl: false
next: false
prev: false
title: "mcpClient"
---

```ts
function mcpClient(transport, opts?): McpClient;
```

Defined in: [packages/mcp/src/index.ts:165](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L165)

Create an [McpClient](/mithril/reference/mcp/index/interfaces/mcpclient/) over a caller-supplied [McpTransport](/mithril/reference/mcp/index/interfaces/mcptransport/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `transport` | [`McpTransport`](/mithril/reference/mcp/index/interfaces/mcptransport/) | Your transport implementation (HTTP/SSE via httpTransport, stdio, or in-memory). |
| `opts?` | [`McpClientOptions`](/mithril/reference/mcp/index/interfaces/mcpclientoptions/) | Optional client identity/capabilities advertised during the handshake (see [McpClientOptions](/mithril/reference/mcp/index/interfaces/mcpclientoptions/)). |

## Returns

[`McpClient`](/mithril/reference/mcp/index/interfaces/mcpclient/)

A client that runs the MCP lifecycle on first use, then lists and calls the server's tools.

## Remarks

The handshake is lazy and runs exactly once — you never call [McpClient.connect](/mithril/reference/mcp/index/interfaces/mcpclient/#connect) yourself
  unless you want the negotiated [McpServerDescription](/mithril/reference/mcp/index/interfaces/mcpserverdescription/) up front.

## Example

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";

// Use the official Streamable-HTTP transport (or implement McpTransport for stdio/in-memory).
const client = mcpClient(httpTransport({ url: "https://example.com/mcp" }));
const tools = await mcpTools(client); // handshake runs here, then hand these to an agent
```
