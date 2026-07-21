---
editUrl: false
next: false
prev: false
title: "McpClient"
---

Defined in: index.ts:44

A connected MCP client over an [McpTransport](/reference/mcp/interfaces/mcptransport/). Create one with [mcpClient](/reference/mcp/functions/mcpclient/).

## Methods

### callTool()

```ts
callTool(name, args): Promise<JsonValue>;
```

Defined in: index.ts:48

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

Defined in: index.ts:50

Close the underlying transport (if it defines [McpTransport.close](/reference/mcp/interfaces/mcptransport/#close)).

#### Returns

`Promise`\<`void`\>

***

### listTools()

```ts
listTools(): Promise<readonly McpToolDef[]>;
```

Defined in: index.ts:46

List the server's advertised tools.

#### Returns

`Promise`\<readonly [`McpToolDef`](/reference/mcp/interfaces/mcptooldef/)[]\>
