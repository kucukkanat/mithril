---
editUrl: false
next: false
prev: false
title: "McpClient"
---

Defined in: [index.ts:45](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/mcp/src/index.ts#L45)

A connected MCP client over an [McpTransport](/mithril/reference/mcp/index/interfaces/mcptransport/). Create one with [mcpClient](/mithril/reference/mcp/index/functions/mcpclient/).

## Methods

### callTool()

```ts
callTool(name, args): Promise<JsonValue>;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/mcp/src/index.ts#L49)

Invoke a tool by name; text content is flattened and JSON-parsed when possible, else returned raw.

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

Defined in: [index.ts:51](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/mcp/src/index.ts#L51)

Close the underlying transport (if it defines [McpTransport.close](/mithril/reference/mcp/index/interfaces/mcptransport/#close)).

#### Returns

`Promise`\<`void`\>

***

### listTools()

```ts
listTools(): Promise<readonly McpToolDef[]>;
```

Defined in: [index.ts:47](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/mcp/src/index.ts#L47)

List the server's advertised tools.

#### Returns

`Promise`\<readonly [`McpToolDef`](/mithril/reference/mcp/index/interfaces/mcptooldef/)[]\>
