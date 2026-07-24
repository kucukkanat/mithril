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

Defined in: [packages/core/src/protocol/middleware.ts:22](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L22)

The result of a tool invocation: a successful `output` or a serialized `error`.
