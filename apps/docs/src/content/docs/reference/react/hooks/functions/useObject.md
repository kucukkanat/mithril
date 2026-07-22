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

Defined in: [hooks.ts:89](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/react/src/hooks.ts#L89)

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
