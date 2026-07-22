---
editUrl: false
next: false
prev: false
title: "compactionSavings"
---

```ts
function compactionSavings(events): number;
```

Defined in: [packages/devtools/src/selectors.ts:159](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/devtools/src/selectors.ts#L159)

Sum the tokens reclaimed by `compaction` events in a log.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | readonly `MithrilEvent`[] | the run's event log. |

## Returns

`number`

the total `savedTokens` across every `compaction` event (0 if none).
