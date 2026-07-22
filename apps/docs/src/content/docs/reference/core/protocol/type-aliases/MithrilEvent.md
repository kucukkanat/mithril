---
editUrl: false
next: false
prev: false
title: "MithrilEvent"
---

```ts
type MithrilEvent = 
  | EventMeta & {
  depsDigest: string;
  input: JsonValue;
  model: string;
  type: "run.start";
}
  | EventMeta & {
  reason: FinishReason;
  type: "run.finish";
  usage: UsageTotals;
}
  | EventMeta & {
  error: SerializedError;
  type: "run.error";
}
  | EventMeta & {
  reason: string;
  type: "run.cancel";
}
  | EventMeta & {
  step: number;
  type: "step.start";
}
  | EventMeta & {
  step: number;
  stop: "tool" | "text" | "output";
  type: "step.finish";
  usage: UsageDelta;
}
  | EventMeta & {
  delta: string;
  type: "text.delta";
}
  | EventMeta & {
  delta: string;
  type: "reasoning.delta";
}
  | EventMeta & {
  callId: string;
  name: string;
  partial: string;
  type: "tool.input.delta";
}
  | EventMeta & {
  callId: string;
  input: JsonValue;
  name: string;
  type: "tool.call";
  version?: string;
}
  | EventMeta & {
  callId: string;
  payload: JsonValue;
  type: "tool.progress";
}
  | EventMeta & {
  callId: string;
  ms: number;
  output: JsonValue;
  type: "tool.result";
}
  | EventMeta & {
  callId: string;
  error: SerializedError;
  type: "tool.error";
}
  | EventMeta & {
  role: "assistant";
  type: "message.end";
  usage: UsageDelta;
}
  | EventMeta & {
  partial: JsonValue;
  type: "object.delta";
}
  | EventMeta & {
  attempt: number;
  issues: JsonValue;
  type: "object.invalid";
}
  | EventMeta & {
  type: "object.final";
  value: JsonValue;
}
  | EventMeta & {
  delta: UsageDelta;
  type: "usage";
}
  | EventMeta & {
  removedSeqRange: readonly [number, number];
  savedTokens: number;
  summarySeq: number;
  type: "compaction";
}
  | EventMeta & {
  callId: string;
  input: JsonValue;
  to: string;
  type: "handoff";
}
  | EventMeta & {
  callId: string;
  output: JsonValue;
  to: string;
  type: "handoff.result";
}
  | EventMeta & {
  callId: string;
  input: JsonValue;
  name: string;
  type: "tool.approval.requested";
  version?: string;
}
  | EventMeta & {
  descriptor: SuspensionDescriptor;
  type: "suspend";
}
  | EventMeta & {
  resolutionFor: string;
  type: "resume";
  value: JsonValue;
}
  | EventMeta & {
  payload: JsonValue;
  type: `custom.${string}`;
};
```

Defined in: [packages/core/src/protocol/events.ts:54](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/events.ts#L54)

The discriminated union of every event on the wire — the core product type.

## Remarks

Discriminated by `type`. Payloads are monomorphic (`input`/`output` are
[JsonValue](/reference/core/protocol/type-aliases/jsonvalue/)) so the union never indexes over a per-tool record, the
structural defence against type-instantiation collapse; per-call input types
are recovered on demand via [narrow](/reference/core/protocol/functions/narrow/).

The union is deliberately **non-exhaustive**: adding a member is a MINOR
version bump, and the trailing `custom.${string}` member is an open escape
hatch. Consumers must route unknown `type`s to a default branch rather than
`assertNever` — see [isKnownEvent](/reference/core/protocol/functions/isknownevent/).
