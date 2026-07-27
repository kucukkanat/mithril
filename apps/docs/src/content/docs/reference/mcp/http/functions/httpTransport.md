---
editUrl: false
next: false
prev: false
title: "httpTransport"
---

```ts
function httpTransport(opts): McpTransport;
```

Defined in: [packages/mcp/src/http.ts:46](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/http.ts#L46)

Create an [McpTransport](/mithril/reference/mcp/index/interfaces/mcptransport/) that speaks MCP over Streamable HTTP.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `fetch?`: \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}; `headers?`: `Readonly`\<`Record`\<`string`, `string`\>\>; `sessionId?`: `string`; `url`: `string`; \} | `url` is the MCP endpoint; `fetch` injects the fetcher (default the global `fetch`); `headers` are sent on every request (e.g. auth); `sessionId` seeds the `Mcp-Session-Id` (usually you let the server assign it — the transport captures it from the `initialize` reply and reuses it). |
| `opts.fetch?` | \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | - |
| `opts.headers?` | `Readonly`\<`Record`\<`string`, `string`\>\> | - |
| `opts.sessionId?` | `string` | - |
| `opts.url` | `string` | - |

## Returns

[`McpTransport`](/mithril/reference/mcp/index/interfaces/mcptransport/)

A transport ready for mcpClient.

## Remarks

Sends `Accept: application/json, text/event-stream` and handles either response shape. A
  server-assigned `Mcp-Session-Id` response header is captured and echoed on all later requests and
  notifications. JSON-RPC errors throw [McpError](/mithril/reference/mcp/index/classes/mcperror/) (with the JSON-RPC `code`/`data`). `notify` posts
  a fire-and-forget notification (no id) and tolerates an empty `202 Accepted` body.

## Example

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";

const client = mcpClient(httpTransport({ url: "https://example.com/mcp", headers: { authorization: token } }));
const tools = await mcpTools(client);
```
