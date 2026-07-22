---
editUrl: false
next: false
prev: false
title: "SuspensionRequest"
---

Defined in: [packages/core/src/protocol/suspension.ts:14](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L14)

A request to pause a run until a human (or external system) supplies a
validated resolution.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Kind` *extends* `string` | `string` | The suspension discriminant, e.g. `'tool.approval'`. |
| `Payload` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | The JSON-safe data shown to the human/UI. |
| `Resolution` | [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | The type the resume value validates to. |

## Properties

### kind

```ts
readonly kind: Kind;
```

Defined in: [packages/core/src/protocol/suspension.ts:19](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L19)

***

### payload

```ts
readonly payload: Payload;
```

Defined in: [packages/core/src/protocol/suspension.ts:21](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L21)

JSON-safe data shown to the human/UI.

***

### resolutionSchema?

```ts
readonly optional resolutionSchema?: StandardSchemaV1<unknown, Resolution>;
```

Defined in: [packages/core/src/protocol/suspension.ts:27](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L27)

Optional validator for the resume input. Supply it (with [SuspensionRequest.resolutionSchemaId](/reference/core/protocol/interfaces/suspensionrequest/#resolutionschemaid))
only when you intend to validate the resolution yourself; the runtime does not validate on resume, so a
plain `ctx.suspend({ kind, payload })` is the common case.

***

### resolutionSchemaId?

```ts
readonly optional resolutionSchemaId?: string;
```

Defined in: [packages/core/src/protocol/suspension.ts:29](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L29)

Optional registry id for the resolution validator; carried on the descriptor for identification.
