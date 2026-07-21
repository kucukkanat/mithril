---
editUrl: false
next: false
prev: false
title: "ProgressReport"
---

Defined in: transformers/edge.ts:31

A model-download progress report (see [EdgeOptions.onProgress](/reference/providers/transformers/interfaces/transformershandleoptions/#onprogress)).

## Properties

### file?

```ts
readonly optional file?: string;
```

Defined in: transformers/edge.ts:33

***

### loaded

```ts
readonly loaded: number;
```

Defined in: transformers/edge.ts:36

***

### progress

```ts
readonly progress: number;
```

Defined in: transformers/edge.ts:35

Overall fraction across all files, `0..1`.

***

### status

```ts
readonly status: string;
```

Defined in: transformers/edge.ts:32

***

### total

```ts
readonly total: number;
```

Defined in: transformers/edge.ts:37
