---
editUrl: false
next: false
prev: false
title: "describeRunnerError"
---

```ts
function describeRunnerError(raw): string | null;
```

Defined in: [runner-web/src/client.ts:86](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/runner-web/src/client.ts#L86)

Map a raw provider/runtime error to a friendly one-liner, or `null` when nothing specific applies.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

`string` \| `null`
