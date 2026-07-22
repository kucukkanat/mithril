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
  callId?: string;
  input: JsonValue;
  kind: "toolCall";
  name: string;
};
```

Defined in: [transformers/core.ts:22](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/providers/src/transformers/core.ts#L22)

One item a [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) yields: a visible text token, or a fully-parsed tool call.
