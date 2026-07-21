---
editUrl: false
next: false
prev: false
title: "RunInspectorOptions"
---

Defined in: packages/devtools/src/dom.ts:212

Options for [mountRunInspector](/reference/devtools/dom/functions/mountruninspector/). Provide exactly one of `events` / `source` / `transport`.

## Properties

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: packages/devtools/src/dom.ts:216

***

### events?

```ts
readonly optional events?: readonly MithrilEvent[];
```

Defined in: packages/devtools/src/dom.ts:213

***

### onResolve?

```ts
readonly optional onResolve?: (resolution) => void;
```

Defined in: packages/devtools/src/dom.ts:217

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resolution` | `ResumeValue` |

#### Returns

`void`

***

### source?

```ts
readonly optional source?: RunSource;
```

Defined in: packages/devtools/src/dom.ts:214

***

### transport?

```ts
readonly optional transport?: EventTransport;
```

Defined in: packages/devtools/src/dom.ts:215
