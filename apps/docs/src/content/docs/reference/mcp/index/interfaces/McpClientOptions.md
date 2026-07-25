---
editUrl: false
next: false
prev: false
title: "McpClientOptions"
---

Defined in: [packages/mcp/src/index.ts:129](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L129)

The client capabilities and identity advertised on `initialize`.

## Properties

### capabilities?

```ts
readonly optional capabilities?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:133](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L133)

Client capabilities advertised on `initialize` (default `{}`).

***

### clientInfo?

```ts
readonly optional clientInfo?: McpClientInfo;
```

Defined in: [packages/mcp/src/index.ts:131](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/mcp/src/index.ts#L131)

Client identity sent on `initialize` (default `{ name: "mithril", version: "0.0.0" }`).
