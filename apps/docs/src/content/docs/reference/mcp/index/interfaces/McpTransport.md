---
editUrl: false
next: false
prev: false
title: "McpTransport"
---

Defined in: [packages/mcp/src/index.ts:69](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L69)

The transport you implement to carry MCP JSON-RPC traffic to a server.

## Remarks

An official Streamable-HTTP transport ships at `@mithril/mcp/http` (httpTransport). Implement
this interface yourself only for other carriers — stdio, or the in-memory server the client is tested
against. `request` carries a call that expects a reply; `notify` (optional) carries a fire-and-forget
JSON-RPC notification such as `notifications/initialized` (a transport that omits it simply skips the
post-handshake notification). Passed to [mcpClient](/mithril/reference/mcp/index/functions/mcpclient/).

## Methods

### close()?

```ts
optional close(): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:75](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L75)

Optional teardown, invoked by [McpClient.close](/mithril/reference/mcp/index/interfaces/mcpclient/#close).

#### Returns

`Promise`\<`void`\>

***

### notify()?

```ts
optional notify(method, params): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:73](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L73)

Send a JSON-RPC notification (no id, no reply expected), e.g. `"notifications/initialized"`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `JsonValue` |

#### Returns

`Promise`\<`void`\>

***

### request()

```ts
request(method, params): Promise<JsonValue>;
```

Defined in: [packages/mcp/src/index.ts:71](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L71)

Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>
