---
editUrl: false
next: false
prev: false
title: "ProgressReport"
---

Defined in: [transformers/edge.ts:41](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L41)

A model-download progress report (see [EdgeOptions.onProgress](/mithril/reference/providers/transformers/interfaces/transformershandleoptions/#onprogress)).

## Properties

### file?

```ts
readonly optional file?: string;
```

Defined in: [transformers/edge.ts:43](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L43)

***

### loaded

```ts
readonly loaded: number;
```

Defined in: [transformers/edge.ts:46](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L46)

***

### progress

```ts
readonly progress: number;
```

Defined in: [transformers/edge.ts:45](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L45)

Overall fraction across all files, `0..1`.

***

### status

```ts
readonly status: string;
```

Defined in: [transformers/edge.ts:42](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L42)

***

### total

```ts
readonly total: number;
```

Defined in: [transformers/edge.ts:47](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/edge.ts#L47)
