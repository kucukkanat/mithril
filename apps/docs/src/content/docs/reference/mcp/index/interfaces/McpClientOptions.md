---
editUrl: false
next: false
prev: false
title: "McpClientOptions"
---

Defined in: [packages/mcp/src/index.ts:130](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L130)

The client capabilities and identity advertised on `initialize`.

## Properties

### capabilities?

```ts
readonly optional capabilities?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:134](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L134)

Client capabilities advertised on `initialize` (default `{}`).

***

### clientInfo?

```ts
readonly optional clientInfo?: McpClientInfo;
```

Defined in: [packages/mcp/src/index.ts:132](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/mcp/src/index.ts#L132)

Client identity sent on `initialize` (default `{ name: "mithril", version: "0.0.0" }`).
