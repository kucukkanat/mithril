---
editUrl: false
next: false
prev: false
title: "summaryKey"
---

```ts
function summaryKey(s): string;
```

Defined in: diff.ts:39

The stable identity of a summarized run: `group::case` when grouped, else `case`. Keep in sync with reports.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `s` | \{ `case`: `string`; `group?`: `string`; \} |
| `s.case` | `string` |
| `s.group?` | `string` |

## Returns

`string`
