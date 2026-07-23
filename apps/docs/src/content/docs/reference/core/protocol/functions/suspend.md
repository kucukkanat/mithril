---
editUrl: false
next: false
prev: false
title: "suspend"
---

```ts
function suspend<Req>(req): Suspend<ResolutionOf<Req>>;
```

Defined in: [packages/core/src/protocol/suspension.ts:109](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L109)

Build a [Suspend](/reference/core/protocol/interfaces/suspend/) marker from a [SuspensionRequest](/reference/core/protocol/interfaces/suspensionrequest/).

## Type Parameters

| Type Parameter |
| ------ |
| `Req` *extends* [`SuspensionRequest`](/reference/core/protocol/interfaces/suspensionrequest/)\<`string`, [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/), [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\> |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | `Req` | The suspension request describing what to wait on. |

## Returns

[`Suspend`](/reference/core/protocol/interfaces/suspend/)\<[`ResolutionOf`](/reference/core/protocol/type-aliases/resolutionof/)\<`Req`\>\>

A [Suspend](/reference/core/protocol/interfaces/suspend/) marker typed with the request's resolution.

## Example

```ts
return suspend(approvalRequest); // pause execute() until resolved
```
