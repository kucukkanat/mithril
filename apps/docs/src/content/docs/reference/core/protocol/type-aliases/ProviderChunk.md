---
editUrl: false
next: false
prev: false
title: "ProviderChunk"
---

```ts
type ProviderChunk = 
  | {
  delta: string;
  type: "text.delta";
}
  | {
  delta: string;
  type: "reasoning.delta";
}
  | {
  callId: string;
  name: string;
  partial: string;
  type: "tool.input.delta";
}
  | {
  callId: string;
  input: JsonValue;
  name: string;
  type: "tool.call";
}
  | {
  partial: JsonValue;
  type: "object.delta";
}
  | {
  finishReason: FinishReason;
  type: "message.end";
  usage: UsageDelta;
};
```

Defined in: [packages/core/src/protocol/provider.ts:74](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L74)

A pre-[EventMeta](/reference/core/protocol/interfaces/eventmeta/) streaming chunk emitted by a [Provider](/reference/core/protocol/interfaces/provider/).

## Remarks

Providers yield chunks, not [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/)s: the loop is the single
`seq` authority and stamps `v`/`runId`/`seq`/`span`/`ts`. This is why
providers cannot assign `seq`, and why the replay cache stores `ProviderChunk[]`.
