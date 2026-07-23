---
editUrl: false
next: false
prev: false
title: "InspectedRun"
---

Defined in: [packages/devtools/src/index.ts:30](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/devtools/src/index.ts#L30)

A captured run: its id, ordered event log, replayed RunState, and [TimelineEntry](/reference/devtools/index/interfaces/timelineentry/) projection.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/devtools/src/index.ts:32](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/devtools/src/index.ts#L32)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/devtools/src/index.ts:31](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/devtools/src/index.ts#L31)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/devtools/src/index.ts:33](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/devtools/src/index.ts#L33)

***

### timeline

```ts
readonly timeline: readonly TimelineEntry[];
```

Defined in: [packages/devtools/src/index.ts:34](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/devtools/src/index.ts#L34)
