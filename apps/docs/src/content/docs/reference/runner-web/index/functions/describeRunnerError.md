---
editUrl: false
next: false
prev: false
title: "describeRunnerError"
---

```ts
function describeRunnerError(raw): string | null;
```

Defined in: [runner-web/src/client.ts:86](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/runner-web/src/client.ts#L86)

Map a raw provider/runtime error to a friendly one-liner, or `null` when nothing specific applies.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

`string` \| `null`
