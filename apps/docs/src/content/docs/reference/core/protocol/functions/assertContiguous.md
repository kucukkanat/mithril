---
editUrl: false
next: false
prev: false
title: "assertContiguous"
---

```ts
function assertContiguous(prev, e): ContiguityResult;
```

Defined in: [packages/core/src/protocol/transport.ts:64](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/transport.ts#L64)

Check whether `e` immediately follows the previously-seen `seq`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prev` | `number` | The last-seen `seq`; `prev < 0` means nothing seen yet. |
| `e` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) | The next event. |

## Returns

[`ContiguityResult`](/reference/core/protocol/type-aliases/contiguityresult/)

`{ ok: true }` when contiguous, else `{ ok: false, missingFrom }`
naming the first missing `seq`.
