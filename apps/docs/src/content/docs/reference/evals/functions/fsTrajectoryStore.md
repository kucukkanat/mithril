---
editUrl: false
next: false
prev: false
title: "fsTrajectoryStore"
---

```ts
function fsTrajectoryStore(fs, opts?): TrajectoryStore;
```

Defined in: [index.ts:273](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L273)

Back a [TrajectoryStore](/reference/evals/interfaces/trajectorystore/) with a Mithril `FileSystem`, one JSON file per case under `dir`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fs` | [`TrajectoryFs`](/reference/evals/interfaces/trajectoryfs/) | any `@mithril/fs` backend (node / opfs / memory) — only `readText`/`writeFile`/`exists` are used. |
| `opts?` | \{ `dir?`: `string`; \} | `dir` is the directory for trajectory files (default `"trajectories"`). |
| `opts.dir?` | `string` | - |

## Returns

[`TrajectoryStore`](/reference/evals/interfaces/trajectorystore/)

a persistent [TrajectoryStore](/reference/evals/interfaces/trajectorystore/).
