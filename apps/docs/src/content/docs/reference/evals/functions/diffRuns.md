---
editUrl: false
next: false
prev: false
title: "diffRuns"
---

```ts
function diffRuns(baseline, current): RunDiff;
```

Defined in: diff.ts:78

Diff two [RunSnapshot](/reference/evals/interfaces/runsnapshot/)s by case key, classifying each as improved / regressed / added / removed.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseline` | [`RunSnapshot`](/reference/evals/interfaces/runsnapshot/) | the reference snapshot (e.g. a pinned previous run). |
| `current` | [`RunSnapshot`](/reference/evals/interfaces/runsnapshot/) | the new snapshot to judge against the baseline. |

## Returns

[`RunDiff`](/reference/evals/interfaces/rundiff/)

a [RunDiff](/reference/evals/interfaces/rundiff/); `regressed` being non-empty is the signal a CI gate should fail on.

## Example

```ts
const { regressed } = diffRuns(baseline, toSnapshot(runs));
if (regressed.length > 0) process.exitCode = 1;
```
