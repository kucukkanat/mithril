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

Defined in: packages/core/src/protocol/middleware.ts:21

The result of a tool invocation: a successful `output` or a serialized `error`.
