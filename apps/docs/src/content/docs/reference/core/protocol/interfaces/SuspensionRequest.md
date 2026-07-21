---
editUrl: false
next: false
prev: false
title: "SuspensionRequest"
---

Defined in: packages/core/src/protocol/suspension.ts:14

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

Defined in: packages/core/src/protocol/suspension.ts:19

***

### payload

```ts
readonly payload: Payload;
```

Defined in: packages/core/src/protocol/suspension.ts:21

JSON-safe data shown to the human/UI.

***

### resolutionSchema

```ts
readonly resolutionSchema: StandardSchemaV1<unknown, Resolution>;
```

Defined in: packages/core/src/protocol/suspension.ts:23

Validator for the resume input — resolutions are validated, never trusted.

***

### resolutionSchemaId

```ts
readonly resolutionSchemaId: string;
```

Defined in: packages/core/src/protocol/suspension.ts:25

Registry id used to re-resolve the validator on open/resume.
