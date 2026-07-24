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

Defined in: [transformers/core.ts:22](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/core.ts#L22)

One item a [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) yields: a visible text token, a reasoning token, or a fully-parsed tool call.
