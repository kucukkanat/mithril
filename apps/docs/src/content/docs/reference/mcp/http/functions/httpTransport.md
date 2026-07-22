---
editUrl: false
next: false
prev: false
title: "httpTransport"
---

```ts
function httpTransport(opts): McpTransport;
```

Defined in: [http.ts:42](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/mcp/src/http.ts#L42)

Create an [McpTransport](/reference/mcp/index/interfaces/mcptransport/) that speaks MCP over Streamable HTTP.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `fetch?`: \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}; `headers?`: `Readonly`\<`Record`\<`string`, `string`\>\>; `sessionId?`: `string`; `url`: `string`; \} | `url` is the MCP endpoint; `fetch` injects the fetcher (default the global `fetch`); `headers` are sent on every request (e.g. auth); `sessionId` is echoed as `Mcp-Session-Id`. |
| `opts.fetch?` | \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | - |
| `opts.headers?` | `Readonly`\<`Record`\<`string`, `string`\>\> | - |
| `opts.sessionId?` | `string` | - |
| `opts.url` | `string` | - |

## Returns

[`McpTransport`](/reference/mcp/index/interfaces/mcptransport/)

A transport ready for mcpClient.

## Remarks

Sends `Accept: application/json, text/event-stream` and handles either response shape. JSON-RPC
errors are thrown as `Error`. Notifications (methods with no reply) are not modeled — `request` always
expects a response.

## Example

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";

const client = mcpClient(httpTransport({ url: "https://example.com/mcp", headers: { authorization: token } }));
const tools = await mcpTools(client);
```
