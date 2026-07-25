---
editUrl: false
next: false
prev: false
title: "McpTransport"
---

Defined in: [packages/mcp/src/index.ts:68](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L68)

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

Defined in: [packages/mcp/src/index.ts:74](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L74)

Optional teardown, invoked by [McpClient.close](/mithril/reference/mcp/index/interfaces/mcpclient/#close).

#### Returns

`Promise`\<`void`\>

***

### notify()?

```ts
optional notify(method, params): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:72](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L72)

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

Defined in: [packages/mcp/src/index.ts:70](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L70)

Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>
