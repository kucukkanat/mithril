---
editUrl: false
next: false
prev: false
title: "McpClientOptions"
---

Defined in: [packages/mcp/src/index.ts:139](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/mcp/src/index.ts#L139)

The client capabilities and identity advertised on `initialize`.

## Properties

### capabilities?

```ts
readonly optional capabilities?: JsonValue;
```

Defined in: [packages/mcp/src/index.ts:143](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/mcp/src/index.ts#L143)

Client capabilities advertised on `initialize` (default `{}`).

***

### clientInfo?

```ts
readonly optional clientInfo?: McpClientInfo;
```

Defined in: [packages/mcp/src/index.ts:141](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/mcp/src/index.ts#L141)

Client identity sent on `initialize` (default `{ name: "mithril", version: "0.0.0" }`).
