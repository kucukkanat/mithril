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
  resolutionSchemaId?: string;
  toolVersion?: string;
};
```

Defined in: [packages/core/src/protocol/suspension.ts:70](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L70)

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

Defined in: [packages/core/src/protocol/suspension.ts:72](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L72)

***

### kind

```ts
readonly kind: string;
```

Defined in: [packages/core/src/protocol/suspension.ts:71](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L71)

***

### payload

```ts
readonly payload: JsonValue;
```

Defined in: [packages/core/src/protocol/suspension.ts:73](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L73)

***

### resolutionSchemaId?

```ts
readonly optional resolutionSchemaId?: string;
```

Defined in: [packages/core/src/protocol/suspension.ts:74](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L74)

***

### toolVersion?

```ts
readonly optional toolVersion?: string;
```

Defined in: [packages/core/src/protocol/suspension.ts:76](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L76)

The pending tool's stamped version, checked on resume for drift.
