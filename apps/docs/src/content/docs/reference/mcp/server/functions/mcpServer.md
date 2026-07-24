---
editUrl: false
next: false
prev: false
title: "mcpServer"
---

```ts
function mcpServer(
   tools, 
   info?, 
   opts?): McpServer;
```

Defined in: [server.ts:57](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/mcp/src/server.ts#L57)

Expose a set of Mithril AnyTools as an MCP server.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tools` | readonly `AnyTool`\<`unknown`\>[] | the tools to advertise and run. |
| `info` | [`McpServerInfo`](/mithril/reference/mcp/server/interfaces/mcpserverinfo/) | server identity returned on `initialize` (default `{ name: "mithril", version: "0.0.0" }`). |
| `opts?` | \{ `deps?`: `unknown`; `runtime?`: `RuntimeAdapter`; `toolSchema?`: `JsonSchemaConverter`; \} | `deps` are injected into each tool's `execute`; `toolSchema` is a JsonSchemaConverter for advertised parameters; `runtime` overrides the RuntimeAdapter. |
| `opts.deps?` | `unknown` | - |
| `opts.runtime?` | `RuntimeAdapter` | - |
| `opts.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

[`McpServer`](/mithril/reference/mcp/server/interfaces/mcpserver/)

an [McpServer](/mithril/reference/mcp/server/interfaces/mcpserver/) with `handle` (one JSON-RPC call) and `serve` (a `fetch` handler).

## Remarks

Implements `initialize`, `tools/list`, and `tools/call`. A tool's output is wrapped as MCP text
content (`JSON.stringify` for non-strings); a thrown error becomes an `isError` text result. `ctx.suspend`
is unavailable in this standalone context and rejects. Any Mithril tool — including one wrapping a
sub-agent via `asTool` — can be served.

## Example

```ts
import { mcpServer } from "@mithril/mcp/server";

const server = mcpServer([weatherTool], { name: "weather", version: "1.0.0" });
// mount on any HTTP framework:
Bun.serve({ port: 8787, fetch: (req) => server.serve(req) });
```
