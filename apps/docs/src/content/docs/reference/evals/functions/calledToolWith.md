---
editUrl: false
next: false
prev: false
title: "calledToolWith"
---

## Call Signature

```ts
function calledToolWith<T>(tool, match): Scorer;
```

Defined in: [index.ts:506](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L506)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory has a `tool.call` for `name` whose input satisfies
`match`, else `0` — for asserting a tool was called with the *right* arguments (not just that it ran).

### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `AnyTool`\<`never`\> |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tool` | `T` | - |
| `match` | (`input`) => `boolean` | a predicate over the call's `input`. |

### Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `calledWith:{name}`.

### Example

```ts
// Pass the tool value — `i` is typed, no cast, rename-safe:
calledToolWith(convertCurrency, (i) => i.amount === 100);
// Or by name — `i` is a JsonValue:
calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100);
```

### See

[calledTool](/reference/evals/functions/calledtool/) for a name-only check.

## Call Signature

```ts
function calledToolWith(name, match): Scorer;
```

Defined in: [index.ts:507](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L507)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory has a `tool.call` for `name` whose input satisfies
`match`, else `0` — for asserting a tool was called with the *right* arguments (not just that it ran).

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | - |
| `match` | (`input`) => `boolean` | a predicate over the call's `input`. |

### Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `calledWith:{name}`.

### Example

```ts
// Pass the tool value — `i` is typed, no cast, rename-safe:
calledToolWith(convertCurrency, (i) => i.amount === 100);
// Or by name — `i` is a JsonValue:
calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100);
```

### See

[calledTool](/reference/evals/functions/calledtool/) for a name-only check.
