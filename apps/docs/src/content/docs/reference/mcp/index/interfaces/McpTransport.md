---
editUrl: false
next: false
prev: false
title: "McpTransport"
---

Defined in: [index.ts:27](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/mcp/src/index.ts#L27)

The transport you implement to carry MCP JSON-RPC calls to a server.

## Remarks

An official Streamable-HTTP transport ships at `@mithril/mcp/http` (httpTransport). Implement
this interface yourself only for other carriers — stdio, or the in-memory server the client is tested
against. Passed to [mcpClient](/reference/mcp/index/functions/mcpclient/).

## Methods

### close()?

```ts
optional close(): Promise<void>;
```

Defined in: [index.ts:31](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/mcp/src/index.ts#L31)

Optional teardown, invoked by [McpClient.close](/reference/mcp/index/interfaces/mcpclient/#close).

#### Returns

`Promise`\<`void`\>

***

### request()

```ts
request(method, params): Promise<JsonValue>;
```

Defined in: [index.ts:29](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/mcp/src/index.ts#L29)

Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>
