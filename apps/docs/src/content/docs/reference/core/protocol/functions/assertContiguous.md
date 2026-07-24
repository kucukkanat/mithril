---
editUrl: false
next: false
prev: false
title: "assertContiguous"
---

```ts
function assertContiguous(prev, e): ContiguityResult;
```

Defined in: [packages/core/src/protocol/transport.ts:64](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/transport.ts#L64)

Check whether `e` immediately follows the previously-seen `seq`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prev` | `number` | The last-seen `seq`; `prev < 0` means nothing seen yet. |
| `e` | [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/) | The next event. |

## Returns

[`ContiguityResult`](/mithril/reference/core/protocol/type-aliases/contiguityresult/)

`{ ok: true }` when contiguous, else `{ ok: false, missingFrom }`
naming the first missing `seq`.
