---
editUrl: false
next: false
prev: false
title: "ProgressReport"
---

Defined in: [transformers/edge.ts:42](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L42)

A model-download progress report (see [EdgeOptions.onProgress](/mithril/reference/providers/transformers/interfaces/transformershandleoptions/#onprogress)).

## Properties

### file?

```ts
readonly optional file?: string;
```

Defined in: [transformers/edge.ts:44](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L44)

***

### loaded

```ts
readonly loaded: number;
```

Defined in: [transformers/edge.ts:47](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L47)

***

### progress

```ts
readonly progress: number;
```

Defined in: [transformers/edge.ts:46](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L46)

Overall fraction across all files, `0..1`.

***

### status

```ts
readonly status: string;
```

Defined in: [transformers/edge.ts:43](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L43)

***

### total

```ts
readonly total: number;
```

Defined in: [transformers/edge.ts:48](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L48)
