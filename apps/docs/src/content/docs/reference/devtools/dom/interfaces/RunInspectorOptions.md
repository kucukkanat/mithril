---
editUrl: false
next: false
prev: false
title: "RunInspectorOptions"
---

Defined in: [packages/devtools/src/dom.ts:212](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L212)

Options for [mountRunInspector](/mithril/reference/devtools/dom/functions/mountruninspector/). Provide exactly one of `events` / `source` / `transport`.

## Properties

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: [packages/devtools/src/dom.ts:216](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L216)

***

### events?

```ts
readonly optional events?: readonly MithrilEvent[];
```

Defined in: [packages/devtools/src/dom.ts:213](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L213)

***

### onResolve?

```ts
readonly optional onResolve?: (resolution) => void;
```

Defined in: [packages/devtools/src/dom.ts:217](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L217)

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

Defined in: [packages/devtools/src/dom.ts:214](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L214)

***

### transport?

```ts
readonly optional transport?: EventTransport;
```

Defined in: [packages/devtools/src/dom.ts:215](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L215)
