---
editUrl: false
next: false
prev: false
title: "SuspensionRequest"
---

Defined in: [packages/core/src/protocol/suspension.ts:14](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/suspension.ts#L14)

A request to pause a run until a human (or external system) supplies a
validated resolution.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Kind` *extends* `string` | `string` | The suspension discriminant, e.g. `'tool.approval'`. |
| `Payload` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | The JSON-safe data shown to the human/UI. |
| `Resolution` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | The type the resume value validates to. |

## Properties

### kind

```ts
readonly kind: Kind;
```

Defined in: [packages/core/src/protocol/suspension.ts:19](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/suspension.ts#L19)

***

### payload

```ts
readonly payload: Payload;
```

Defined in: [packages/core/src/protocol/suspension.ts:21](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/suspension.ts#L21)

JSON-safe data shown to the human/UI.

***

### resolutionSchema?

```ts
readonly optional resolutionSchema?: StandardSchemaV1<unknown, Resolution>;
```

Defined in: [packages/core/src/protocol/suspension.ts:27](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/suspension.ts#L27)

Optional validator for the resume input. Supply it (with [SuspensionRequest.resolutionSchemaId](/mithril/reference/core/protocol/interfaces/suspensionrequest/#resolutionschemaid))
only when you intend to validate the resolution yourself; the runtime does not validate on resume, so a
plain `ctx.suspend({ kind, payload })` is the common case.

***

### resolutionSchemaId?

```ts
readonly optional resolutionSchemaId?: string;
```

Defined in: [packages/core/src/protocol/suspension.ts:29](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/suspension.ts#L29)

Optional registry id for the resolution validator; carried on the descriptor for identification.
