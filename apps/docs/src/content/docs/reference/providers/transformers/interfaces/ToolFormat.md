---
editUrl: false
next: false
prev: false
title: "ToolFormat"
---

Defined in: transformers/tool-formats.ts:16

How one model family delimits + encodes tool calls in generated text.

## Remarks

`start`/`end` are the literal sentinels the state machine watches for (`end: null` ⇒ the call runs
to end-of-stream). `extract` turns the raw payload between them into zero-or-more `{ name, input }` calls.

## Properties

### end

```ts
readonly end: string | null;
```

Defined in: transformers/tool-formats.ts:19

***

### name

```ts
readonly name: string;
```

Defined in: transformers/tool-formats.ts:17

***

### start

```ts
readonly start: string;
```

Defined in: transformers/tool-formats.ts:18

## Methods

### extract()

```ts
extract(payload): {
  input: JsonValue;
  name: string;
}[];
```

Defined in: transformers/tool-formats.ts:20

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `string` |

#### Returns

\{
  `input`: `JsonValue`;
  `name`: `string`;
\}[]
