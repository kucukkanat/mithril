---
editUrl: false
next: false
prev: false
title: "McpServerDescription"
---

Defined in: [packages/mcp/src/index.ts:90](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L90)

The result of the MCP lifecycle handshake — what the server negotiated on `initialize`.

## Properties

### capabilities

```ts
readonly capabilities: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:94](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L94)

The server's advertised capabilities (`tools`, `resources`, `prompts`, …), kept opaque.

***

### protocolVersion

```ts
readonly protocolVersion: string;
```

Defined in: [packages/mcp/src/index.ts:92](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L92)

Protocol revision the server agreed to (may differ from [MCP\_PROTOCOL\_VERSION](/mithril/reference/mcp/index/variables/mcp_protocol_version/)).

***

### serverInfo

```ts
readonly serverInfo: {
  name: string;
  version: string;
};
```

Defined in: [packages/mcp/src/index.ts:96](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L96)

The server's self-identification.

#### name

```ts
readonly name: string;
```

#### version

```ts
readonly version: string;
```
