---
editUrl: false
next: false
prev: false
title: "McpClient"
---

Defined in: [packages/mcp/src/index.ts:107](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L107)

A connected MCP client over an [McpTransport](/mithril/reference/mcp/index/interfaces/mcptransport/). Create one with [mcpClient](/mithril/reference/mcp/index/functions/mcpclient/).

## Properties

### server

```ts
readonly server: 
  | McpServerDescription
  | undefined;
```

Defined in: [packages/mcp/src/index.ts:115](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L115)

The negotiated server info once [McpClient.connect](/mithril/reference/mcp/index/interfaces/mcpclient/#connect) has completed, else `undefined`.

## Methods

### callTool()

```ts
callTool(name, args): Promise<JsonValue>;
```

Defined in: [packages/mcp/src/index.ts:122](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L122)

Invoke a tool by name. Prefers the result's `structuredContent`; otherwise flattens text content
(JSON-parsed when possible). **Throws [McpError](/mithril/reference/mcp/index/classes/mcperror/) when the result is flagged `isError`.**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `args` | `JsonValue` |

#### Returns

`Promise`\<`JsonValue`\>

***

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:126](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L126)

Close the underlying transport (if it defines [McpTransport.close](/mithril/reference/mcp/index/interfaces/mcptransport/#close)).

#### Returns

`Promise`\<`void`\>

***

### connect()

```ts
connect(): Promise<McpServerDescription>;
```

Defined in: [packages/mcp/src/index.ts:113](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L113)

Run the lifecycle handshake (`initialize` → `notifications/initialized`) and return the negotiated
[McpServerDescription](/mithril/reference/mcp/index/interfaces/mcpserverdescription/). Idempotent and concurrency-safe: called automatically before the first
[McpClient.listTools](/mithril/reference/mcp/index/interfaces/mcpclient/#listtools)/[McpClient.callTool](/mithril/reference/mcp/index/interfaces/mcpclient/#calltool), and only ever executes once per client.

#### Returns

`Promise`\<[`McpServerDescription`](/mithril/reference/mcp/index/interfaces/mcpserverdescription/)\>

***

### listTools()

```ts
listTools(): Promise<readonly McpToolDef[]>;
```

Defined in: [packages/mcp/src/index.ts:117](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L117)

List the server's advertised tools, following `nextCursor` pagination to completion.

#### Returns

`Promise`\<readonly [`McpToolDef`](/mithril/reference/mcp/index/interfaces/mcptooldef/)[]\>

***

### ping()

```ts
ping(): Promise<void>;
```

Defined in: [packages/mcp/src/index.ts:124](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L124)

Liveness check — resolves when the server answers an MCP `ping`.

#### Returns

`Promise`\<`void`\>
