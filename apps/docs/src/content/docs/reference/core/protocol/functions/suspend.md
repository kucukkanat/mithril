---
editUrl: false
next: false
prev: false
title: "suspend"
---

```ts
function suspend<Req>(req): Suspend<ResolutionOf<Req>>;
```

Defined in: [packages/core/src/protocol/suspension.ts:109](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/suspension.ts#L109)

Build a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker from a [SuspensionRequest](/mithril/reference/core/protocol/interfaces/suspensionrequest/).

## Type Parameters

| Type Parameter |
| ------ |
| `Req` *extends* [`SuspensionRequest`](/mithril/reference/core/protocol/interfaces/suspensionrequest/)\<`string`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/), [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\> |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | `Req` | The suspension request describing what to wait on. |

## Returns

[`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<[`ResolutionOf`](/mithril/reference/core/protocol/type-aliases/resolutionof/)\<`Req`\>\>

A [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker typed with the request's resolution.

## Example

```ts
return suspend(approvalRequest); // pause execute() until resolved
```
