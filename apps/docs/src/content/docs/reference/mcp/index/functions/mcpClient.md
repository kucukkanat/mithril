---
editUrl: false
next: false
prev: false
title: "mcpClient"
---

```ts
function mcpClient(transport): McpClient;
```

Defined in: [index.ts:69](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/mcp/src/index.ts#L69)

Create an [McpClient](/mithril/reference/mcp/index/interfaces/mcpclient/) over a caller-supplied [McpTransport](/mithril/reference/mcp/index/interfaces/mcptransport/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `transport` | [`McpTransport`](/mithril/reference/mcp/index/interfaces/mcptransport/) | Your transport implementation (HTTP/SSE, stdio, or in-memory). |

## Returns

[`McpClient`](/mithril/reference/mcp/index/interfaces/mcpclient/)

A client that can list and call the server's tools.

## Example

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";

// Use the official Streamable-HTTP transport (or implement McpTransport for stdio/in-memory).
const client = mcpClient(httpTransport({ url: "https://example.com/mcp" }));
const tools = await mcpTools(client); // hand these to an agent
```
