---
editUrl: false
next: false
prev: false
title: "ToolOutcome"
---

```ts
type ToolOutcome = 
  | {
  callId: string;
  output: JsonValue;
  status: "ok";
}
  | {
  callId: string;
  error: SerializedError;
  status: "error";
};
```

Defined in: [packages/core/src/protocol/middleware.ts:21](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/middleware.ts#L21)

The result of a tool invocation: a successful `output` or a serialized `error`.
