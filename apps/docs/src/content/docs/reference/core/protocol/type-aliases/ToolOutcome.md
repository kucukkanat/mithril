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

Defined in: [packages/core/src/protocol/middleware.ts:21](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L21)

The result of a tool invocation: a successful `output` or a serialized `error`.
