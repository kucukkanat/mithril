---
editUrl: false
next: false
prev: false
title: "describeRunnerError"
---

```ts
function describeRunnerError(raw): string | null;
```

Defined in: [runner-web/src/client.ts:93](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/client.ts#L93)

Map a raw provider/runtime error to a friendly one-liner, or `null` when nothing specific applies.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

`string` \| `null`
