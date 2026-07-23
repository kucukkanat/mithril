---
editUrl: false
next: false
prev: false
title: "ToolFormat"
---

Defined in: [transformers/tool-formats.ts:17](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/transformers/tool-formats.ts#L17)

How one model family delimits + encodes tool calls in generated text.

## Remarks

`start`/`end` are the literal sentinels the state machine watches for (`end: null` ⇒ the call runs
to end-of-stream). `extract` turns the raw payload between them into zero-or-more `{ name, input }` calls.

## Properties

### end

```ts
readonly end: string | null;
```

Defined in: [transformers/tool-formats.ts:20](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/transformers/tool-formats.ts#L20)

***

### name

```ts
readonly name: string;
```

Defined in: [transformers/tool-formats.ts:18](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/transformers/tool-formats.ts#L18)

***

### start

```ts
readonly start: string;
```

Defined in: [transformers/tool-formats.ts:19](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/transformers/tool-formats.ts#L19)

## Methods

### extract()

```ts
extract(payload): {
  input: JsonValue;
  name: string;
}[];
```

Defined in: [transformers/tool-formats.ts:21](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/providers/src/transformers/tool-formats.ts#L21)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `string` |

#### Returns

\{
  `input`: `JsonValue`;
  `name`: `string`;
\}[]
