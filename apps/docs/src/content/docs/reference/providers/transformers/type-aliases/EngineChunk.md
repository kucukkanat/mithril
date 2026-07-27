---
editUrl: false
next: false
prev: false
title: "EngineChunk"
---

```ts
type EngineChunk = 
  | {
  kind: "token";
  text: string;
}
  | {
  kind: "reasoning";
  text: string;
}
  | {
  callId?: string;
  input: JsonValue;
  kind: "toolCall";
  name: string;
};
```

Defined in: [transformers/core.ts:23](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/core.ts#L23)

One item a [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) yields: a visible text token, a reasoning token, or a fully-parsed tool call.
