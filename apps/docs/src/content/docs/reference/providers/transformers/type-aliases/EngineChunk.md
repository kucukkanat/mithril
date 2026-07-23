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

Defined in: [transformers/core.ts:22](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/core.ts#L22)

One item a [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) yields: a visible text token, a reasoning token, or a fully-parsed tool call.
