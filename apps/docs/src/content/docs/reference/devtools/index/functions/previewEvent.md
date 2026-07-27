---
editUrl: false
next: false
prev: false
title: "previewEvent"
---

```ts
function previewEvent(e): string;
```

Defined in: [packages/devtools/src/selectors.ts:42](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/devtools/src/selectors.ts#L42)

A short, human-friendly one-line preview of an event's payload, for an inspector row.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | `MithrilEvent` | the event to preview. |

## Returns

`string`

a compact string (≤90 chars), or `""` when there is nothing useful to show.
