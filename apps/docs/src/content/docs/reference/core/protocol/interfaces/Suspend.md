---
editUrl: false
next: false
prev: false
title: "Suspend"
---

Defined in: packages/core/src/protocol/suspension.ts:87

The marker value a tool's `execute` returns to request a replay-free mid-tool pause.

## Remarks

Returning this from a tool (Tier-1b) is not wired in the current runtime slice
— the loop rejects it with a `NOT_IMPLEMENTED` error. The value shape is stable.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Out` | The resolution type fed back as the tool result on resume. |

## Properties

### \_\_out?

```ts
readonly optional __out?: Out;
```

Defined in: packages/core/src/protocol/suspension.ts:89

***

### \[SUSPEND\]

```ts
readonly [SUSPEND]: true;
```

Defined in: packages/core/src/protocol/suspension.ts:88

***

### request

```ts
readonly request: SuspensionRequest;
```

Defined in: packages/core/src/protocol/suspension.ts:90
