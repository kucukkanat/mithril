---
editUrl: false
next: false
prev: false
title: "calledToolWith"
---

```ts
function calledToolWith(name, match): Scorer;
```

Defined in: index.ts:343

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory has a `tool.call` for `name` whose input satisfies
`match`, else `0` — for asserting a tool was called with the *right* arguments (not just that it ran).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the tool name to look for in the event log. |
| `match` | (`input`) => `boolean` | a predicate over the call's `input` (JsonValue). |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `calledWith:{name}`.

## Example

```ts
// the model converted the right amount:
calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100);
```

## See

[calledTool](/reference/evals/functions/calledtool/) for a name-only check.
