---
editUrl: false
next: false
prev: false
title: "mcpTools"
---

```ts
function mcpTools(client): Promise<readonly Tool<string, JsonValue, JsonValue, unknown>[]>;
```

Defined in: [packages/mcp/src/index.ts:310](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/mcp/src/index.ts#L310)

Fetch an MCP server's tools and wrap each as a Mithril Tool that calls it.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`McpClient`](/mithril/reference/mcp/index/interfaces/mcpclient/) | A connected [McpClient](/mithril/reference/mcp/index/interfaces/mcpclient/) (see [mcpClient](/mithril/reference/mcp/index/functions/mcpclient/)). |

## Returns

`Promise`\<readonly `Tool`\<`string`, `JsonValue`, `JsonValue`, `unknown`\>[]\>

One Mithril tool per advertised MCP tool, ready to hand to an agent.

## Remarks

Runs the lifecycle handshake (via [McpClient.listTools](/mithril/reference/mcp/index/interfaces/mcpclient/#listtools)) if it has not happened yet. Execution
routes through [McpClient.callTool](/mithril/reference/mcp/index/interfaces/mcpclient/#calltool), so a server-reported `isError` result throws [McpError](/mithril/reference/mcp/index/classes/mcperror/)
and the agent loop surfaces it as a `tool.error`.

The server's `inputSchema` is compiled with `fromJsonSchema` where possible, so the model is offered the
tool's **real** parameters and obviously-invalid arguments fail locally instead of costing a round-trip.
Compilation is lenient: keywords outside the supported subset (`$ref`, `oneOf`, …) are dropped rather
than enforced, and a schema that cannot be compiled at all falls back to passthrough — so a server is
never unusable merely because of a keyword we cannot check. What is *not* validated is simply forwarded,
as before.
