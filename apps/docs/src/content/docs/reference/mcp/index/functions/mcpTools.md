---
editUrl: false
next: false
prev: false
title: "mcpTools"
---

```ts
function mcpTools(client): Promise<readonly Tool<string, JsonValue, JsonValue, unknown>[]>;
```

Defined in: [packages/mcp/src/index.ts:276](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L276)

Fetch an MCP server's tools and wrap each as a Mithril Tool that calls it.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`McpClient`](/mithril/reference/mcp/index/interfaces/mcpclient/) | A connected [McpClient](/mithril/reference/mcp/index/interfaces/mcpclient/) (see [mcpClient](/mithril/reference/mcp/index/functions/mcpclient/)). |

## Returns

`Promise`\<readonly `Tool`\<`string`, `JsonValue`, `JsonValue`, `unknown`\>[]\>

One Mithril tool per advertised MCP tool, ready to hand to an agent.

## Remarks

Runs the lifecycle handshake (via [McpClient.listTools](/mithril/reference/mcp/index/interfaces/mcpclient/#listtools)) if it has not happened yet. Each wrapped
tool uses a **passthrough, non-validating** schema: the server's JSON Schema is not enforced client-side,
so inputs are forwarded to the server as-is. Execution routes through [McpClient.callTool](/mithril/reference/mcp/index/interfaces/mcpclient/#calltool), so a
server-reported `isError` result throws [McpError](/mithril/reference/mcp/index/classes/mcperror/) and the agent loop surfaces it as a `tool.error`.
