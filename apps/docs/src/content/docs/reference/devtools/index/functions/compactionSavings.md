---
editUrl: false
next: false
prev: false
title: "compactionSavings"
---

```ts
function compactionSavings(events): number;
```

Defined in: packages/devtools/src/selectors.ts:159

Sum the tokens reclaimed by `compaction` events in a log.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | readonly `MithrilEvent`[] | the run's event log. |

## Returns

`number`

the total `savedTokens` across every `compaction` event (0 if none).
