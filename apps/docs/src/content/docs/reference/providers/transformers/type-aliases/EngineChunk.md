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

Defined in: [transformers/core.ts:22](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/providers/src/transformers/core.ts#L22)

One item a [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) yields: a visible text token, or a fully-parsed tool call.
