---
editUrl: false
next: false
prev: false
title: "ProgressReport"
---

Defined in: [transformers/edge.ts:31](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L31)

A model-download progress report (see [EdgeOptions.onProgress](/reference/providers/transformers/interfaces/transformershandleoptions/#onprogress)).

## Properties

### file?

```ts
readonly optional file?: string;
```

Defined in: [transformers/edge.ts:33](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L33)

***

### loaded

```ts
readonly loaded: number;
```

Defined in: [transformers/edge.ts:36](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L36)

***

### progress

```ts
readonly progress: number;
```

Defined in: [transformers/edge.ts:35](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L35)

Overall fraction across all files, `0..1`.

***

### status

```ts
readonly status: string;
```

Defined in: [transformers/edge.ts:32](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L32)

***

### total

```ts
readonly total: number;
```

Defined in: [transformers/edge.ts:37](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L37)
