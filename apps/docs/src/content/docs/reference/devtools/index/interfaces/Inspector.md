---
editUrl: false
next: false
prev: false
title: "Inspector"
---

Defined in: [packages/devtools/src/index.ts:43](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L43)

A headless run inspector.

## Remarks

Add [Inspector.consumer](/mithril/reference/devtools/index/interfaces/inspector/#consumer) to an agent (via `use:` or `agentLoop`'s `consumers`) and it
records every run. Everything else is derived on read.

## Properties

### consumer

```ts
readonly consumer: EventConsumer;
```

Defined in: [packages/devtools/src/index.ts:45](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L45)

The EventConsumer to attach to an agent; records every event it sees.

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [packages/devtools/src/index.ts:53](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L53)

Drop all retained runs.

#### Returns

`void`

***

### get()

```ts
get(runId): 
  | InspectedRun
  | undefined;
```

Defined in: [packages/devtools/src/index.ts:49](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L49)

The captured run for `runId`, or `undefined` if unknown/evicted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

  \| [`InspectedRun`](/mithril/reference/devtools/index/interfaces/inspectedrun/)
  \| `undefined`

***

### latest()

```ts
latest(): 
  | InspectedRun
  | undefined;
```

Defined in: [packages/devtools/src/index.ts:51](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L51)

The most recently started run, or `undefined` if none.

#### Returns

  \| [`InspectedRun`](/mithril/reference/devtools/index/interfaces/inspectedrun/)
  \| `undefined`

***

### runIds()

```ts
runIds(): readonly string[];
```

Defined in: [packages/devtools/src/index.ts:47](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L47)

The ids of currently-retained runs, oldest first.

#### Returns

readonly `string`[]
