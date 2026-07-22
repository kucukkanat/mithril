---
editUrl: false
next: false
prev: false
title: "mcpClient"
---

```ts
function mcpClient(transport): McpClient;
```

Defined in: [index.ts:69](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/mcp/src/index.ts#L69)

Create an [McpClient](/reference/mcp/index/interfaces/mcpclient/) over a caller-supplied [McpTransport](/reference/mcp/index/interfaces/mcptransport/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `transport` | [`McpTransport`](/reference/mcp/index/interfaces/mcptransport/) | Your transport implementation (HTTP/SSE, stdio, or in-memory). |

## Returns

[`McpClient`](/reference/mcp/index/interfaces/mcpclient/)

A client that can list and call the server's tools.

## Example

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";

// Use the official Streamable-HTTP transport (or implement McpTransport for stdio/in-memory).
const client = mcpClient(httpTransport({ url: "https://example.com/mcp" }));
const tools = await mcpTools(client); // hand these to an agent
```
