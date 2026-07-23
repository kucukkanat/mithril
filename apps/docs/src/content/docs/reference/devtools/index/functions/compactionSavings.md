---
editUrl: false
next: false
prev: false
title: "compactionSavings"
---

```ts
function compactionSavings(events): number;
```

Defined in: [packages/devtools/src/selectors.ts:159](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/devtools/src/selectors.ts#L159)

Sum the tokens reclaimed by `compaction` events in a log.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | readonly `MithrilEvent`[] | the run's event log. |

## Returns

`number`

the total `savedTokens` across every `compaction` event (0 if none).
