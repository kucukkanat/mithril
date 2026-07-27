---
editUrl: false
next: false
prev: false
title: "McpServerDescription"
---

Defined in: [packages/mcp/src/index.ts:97](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L97)

The result of the MCP lifecycle handshake — what the server negotiated on `initialize`.

## Properties

### capabilities

```ts
readonly capabilities: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:101](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L101)

The server's advertised capabilities (`tools`, `resources`, `prompts`, …), kept opaque.

***

### protocolVersion

```ts
readonly protocolVersion: string;
```

Defined in: [packages/mcp/src/index.ts:99](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L99)

Protocol revision the server agreed to (may differ from [MCP\_PROTOCOL\_VERSION](/mithril/reference/mcp/index/variables/mcp_protocol_version/)).

***

### serverInfo

```ts
readonly serverInfo: {
  name: string;
  version: string;
};
```

Defined in: [packages/mcp/src/index.ts:103](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L103)

The server's self-identification.

#### name

```ts
readonly name: string;
```

#### version

```ts
readonly version: string;
```
