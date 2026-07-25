---
editUrl: false
next: false
prev: false
title: "McpServerDescription"
---

Defined in: [packages/mcp/src/index.ts:91](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L91)

The result of the MCP lifecycle handshake — what the server negotiated on `initialize`.

## Properties

### capabilities

```ts
readonly capabilities: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:95](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L95)

The server's advertised capabilities (`tools`, `resources`, `prompts`, …), kept opaque.

***

### protocolVersion

```ts
readonly protocolVersion: string;
```

Defined in: [packages/mcp/src/index.ts:93](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L93)

Protocol revision the server agreed to (may differ from [MCP\_PROTOCOL\_VERSION](/mithril/reference/mcp/index/variables/mcp_protocol_version/)).

***

### serverInfo

```ts
readonly serverInfo: {
  name: string;
  version: string;
};
```

Defined in: [packages/mcp/src/index.ts:97](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L97)

The server's self-identification.

#### name

```ts
readonly name: string;
```

#### version

```ts
readonly version: string;
```
