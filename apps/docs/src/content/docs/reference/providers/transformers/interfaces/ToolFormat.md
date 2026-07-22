---
editUrl: false
next: false
prev: false
title: "ToolFormat"
---

Defined in: [transformers/tool-formats.ts:16](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L16)

How one model family delimits + encodes tool calls in generated text.

## Remarks

`start`/`end` are the literal sentinels the state machine watches for (`end: null` ⇒ the call runs
to end-of-stream). `extract` turns the raw payload between them into zero-or-more `{ name, input }` calls.

## Properties

### end

```ts
readonly end: string | null;
```

Defined in: [transformers/tool-formats.ts:19](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L19)

***

### name

```ts
readonly name: string;
```

Defined in: [transformers/tool-formats.ts:17](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L17)

***

### start

```ts
readonly start: string;
```

Defined in: [transformers/tool-formats.ts:18](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L18)

## Methods

### extract()

```ts
extract(payload): {
  input: JsonValue;
  name: string;
}[];
```

Defined in: [transformers/tool-formats.ts:20](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L20)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `string` |

#### Returns

\{
  `input`: `JsonValue`;
  `name`: `string`;
\}[]
