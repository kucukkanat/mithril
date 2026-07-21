---
editUrl: false
next: false
prev: false
title: "SuspensionDescriptor"
---

```ts
type SuspensionDescriptor = {
  callId?: string;
  kind: string;
  payload: JsonValue;
  resolutionSchemaId: string;
  toolVersion?: string;
};
```

Defined in: packages/core/src/protocol/suspension.ts:66

A serializable, UI-facing view of what a run is waiting on, carried on the
`suspend` event and [RunState.pending](/reference/core/protocol/interfaces/runstate/#pending).

## Remarks

Declared as a `type` (not `interface`) so it gains an implicit index
signature and is assignable to [JsonValue](/reference/core/protocol/type-aliases/jsonvalue/) — [HandoffSuspension](/reference/core/protocol/type-aliases/handoffsuspension/)
embeds it as a payload.

## Properties

### callId?

```ts
readonly optional callId?: string;
```

Defined in: packages/core/src/protocol/suspension.ts:68

***

### kind

```ts
readonly kind: string;
```

Defined in: packages/core/src/protocol/suspension.ts:67

***

### payload

```ts
readonly payload: JsonValue;
```

Defined in: packages/core/src/protocol/suspension.ts:69

***

### resolutionSchemaId

```ts
readonly resolutionSchemaId: string;
```

Defined in: packages/core/src/protocol/suspension.ts:70

***

### toolVersion?

```ts
readonly optional toolVersion?: string;
```

Defined in: packages/core/src/protocol/suspension.ts:72

The pending tool's stamped version, checked on resume for drift.
