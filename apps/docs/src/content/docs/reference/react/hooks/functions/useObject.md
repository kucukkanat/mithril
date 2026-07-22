---
editUrl: false
next: false
prev: false
title: "useObject"
---

```ts
function useObject(source): {
  partial: JsonValue | undefined;
  value: JsonValue | undefined;
};
```

Defined in: [hooks.ts:89](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/react/src/hooks.ts#L89)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`RunSource`](/reference/react/hooks/interfaces/runsource/) \| `undefined` |

## Returns

```ts
{
  partial: JsonValue | undefined;
  value: JsonValue | undefined;
}
```

### partial

```ts
readonly partial: JsonValue | undefined;
```

### value

```ts
readonly value: JsonValue | undefined;
```
