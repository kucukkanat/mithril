---
editUrl: false
next: false
prev: false
title: "McpClientOptions"
---

Defined in: [packages/mcp/src/index.ts:139](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L139)

The client capabilities and identity advertised on `initialize`.

## Properties

### capabilities?

```ts
readonly optional capabilities?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:143](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L143)

Client capabilities advertised on `initialize` (default `{}`).

***

### clientInfo?

```ts
readonly optional clientInfo?: McpClientInfo;
```

Defined in: [packages/mcp/src/index.ts:141](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/mcp/src/index.ts#L141)

Client identity sent on `initialize` (default `{ name: "mithril", version: "0.0.0" }`).
