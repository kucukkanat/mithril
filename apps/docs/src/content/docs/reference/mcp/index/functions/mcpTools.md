---
editUrl: false
next: false
prev: false
title: "mcpTools"
---

```ts
function mcpTools(client): Promise<readonly Tool<string, JsonValue, JsonValue, unknown>[]>;
```

Defined in: [index.ts:113](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/mcp/src/index.ts#L113)

Fetch an MCP server's tools and wrap each as a Mithril Tool that calls it.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`McpClient`](/reference/mcp/index/interfaces/mcpclient/) | A connected [McpClient](/reference/mcp/index/interfaces/mcpclient/) (see [mcpClient](/reference/mcp/index/functions/mcpclient/)). |

## Returns

`Promise`\<readonly `Tool`\<`string`, `JsonValue`, `JsonValue`, `unknown`\>[]\>

One Mithril tool per advertised MCP tool, ready to hand to an agent.

## Remarks

Each wrapped tool uses a **passthrough, non-validating** schema: the server's JSON Schema is not
enforced client-side, so inputs are forwarded to the server as-is. Execution routes through
[McpClient.callTool](/reference/mcp/index/interfaces/mcpclient/#calltool).
