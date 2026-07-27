---
editUrl: false
next: false
prev: false
title: "ToolFormat"
---

Defined in: [transformers/tool-formats.ts:19](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L19)

How one model family delimits + encodes tool calls in generated text.

## Remarks

`start`/`end` are the literal sentinels the state machine watches for (`end: null` ⇒ the call runs
to end-of-stream). `extract` turns the raw payload between them into zero-or-more `{ name, input }` calls.
`render` is its inverse: it writes calls back in this family's grammar so a multi-turn history can replay
the assistant turn exactly as the model itself would have emitted it.

## Properties

### end

```ts
readonly end: string | null;
```

Defined in: [transformers/tool-formats.ts:22](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L22)

***

### name

```ts
readonly name: string;
```

Defined in: [transformers/tool-formats.ts:20](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L20)

***

### start

```ts
readonly start: string;
```

Defined in: [transformers/tool-formats.ts:21](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L21)

## Methods

### extract()

```ts
extract(payload): {
  input: JsonValue;
  name: string;
}[];
```

Defined in: [transformers/tool-formats.ts:23](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L23)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `string` |

#### Returns

\{
  `input`: `JsonValue`;
  `name`: `string`;
\}[]

***

### render()

```ts
render(calls): string;
```

Defined in: [transformers/tool-formats.ts:25](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L25)

Write calls back in this family's grammar — the inverse of [ToolFormat.extract](/mithril/reference/providers/transformers/interfaces/toolformat/#extract).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `calls` | readonly \{ `input`: `JsonValue`; `name`: `string`; \}[] |

#### Returns

`string`
