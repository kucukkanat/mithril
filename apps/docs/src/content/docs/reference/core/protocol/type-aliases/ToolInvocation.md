---
editUrl: false
next: false
prev: false
title: "ToolInvocation"
---

```ts
type ToolInvocation = {
  callId: string;
  input: JsonValue;
  name: string;
  version?: string;
};
```

Defined in: [packages/core/src/protocol/middleware.ts:13](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L13)

A tool call passed to a [Middleware.tool](/reference/core/protocol/interfaces/middleware/#tool) wrapper.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:14](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L14)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/middleware.ts:16](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L16)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:15](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L15)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:17](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L17)
