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

Defined in: hooks.ts:55

Track a run's structured output as it streams.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`RunSource`](/reference/react/hooks/interfaces/runsource/) | A [RunSource](/reference/react/hooks/interfaces/runsource/) whose run emits `object.delta` / `object.final` events. |

## Returns

```ts
{
  partial: JsonValue | undefined;
  value: JsonValue | undefined;
}
```

`{ partial, value }` — `partial` is the latest in-flight object (from `object.delta`),
`value` is the finalized object (from `object.final`); each is `undefined` until seen.

### partial

```ts
readonly partial: JsonValue | undefined;
```

### value

```ts
readonly value: JsonValue | undefined;
```
