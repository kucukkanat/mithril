---
editUrl: false
next: false
prev: false
title: "@mithril/mcp"
---

Connect to an MCP server, list its tools, and expose them as Mithril tools — and, the other direction,
expose Mithril tools as an MCP server.

## Remarks

An official Streamable-HTTP transport ships at `@mithril/mcp/http` (httpTransport); you can still
implement [McpTransport](/reference/mcp/interfaces/mcptransport/) yourself (stdio, in-memory). Pass a transport to [mcpClient](/reference/mcp/functions/mcpclient/), then
wrap the tools with [mcpTools](/reference/mcp/functions/mcptools/). To serve your own tools over MCP, use `mcpServer` from
`@mithril/mcp/server`.

## Interfaces

- [McpClient](/reference/mcp/interfaces/mcpclient/)
- [McpToolDef](/reference/mcp/interfaces/mcptooldef/)
- [McpTransport](/reference/mcp/interfaces/mcptransport/)

## Functions

- [mcpClient](/reference/mcp/functions/mcpclient/)
- [mcpTools](/reference/mcp/functions/mcptools/)
