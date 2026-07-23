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

Defined in: [packages/core/src/protocol/middleware.ts:22](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/middleware.ts#L22)

The result of a tool invocation: a successful `output` or a serialized `error`.
