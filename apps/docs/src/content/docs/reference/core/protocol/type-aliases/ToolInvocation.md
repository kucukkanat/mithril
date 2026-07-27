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

Defined in: [packages/core/src/protocol/middleware.ts:15](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L15)

A tool call passed to a [Middleware.tool](/mithril/reference/core/protocol/interfaces/middleware/#tool) wrapper.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:16](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L16)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/middleware.ts:18](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L18)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:17](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L17)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:19](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/middleware.ts#L19)
