---
editUrl: false
next: false
prev: false
title: "McpTransport"
---

Defined in: [packages/mcp/src/index.ts:69](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L69)

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

Defined in: [packages/mcp/src/index.ts:81](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L81)

Optional teardown, invoked by [McpClient.close](/mithril/reference/mcp/index/interfaces/mcpclient/#close).

#### Returns

`Promise`\<`void`\>

***

### notify()?

```ts
optional notify(method, params): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:79](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L79)

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
request(
   method, 
   params, 
signal?): Promise<JsonValue>;
```

Defined in: [packages/mcp/src/index.ts:77](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/mcp/src/index.ts#L77)

Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `method` | `string` | - |
| `params` | `JsonValue` | - |
| `signal?` | `AbortSignal` | aborts the in-flight request when the calling run is cancelled. Optional so existing two-parameter transports still satisfy this interface; a transport that ignores it simply cannot be cancelled, and a long `tools/call` will outlive the run that started it. |

#### Returns

`Promise`\<`JsonValue`\>
