---
editUrl: false
next: false
prev: false
title: "Suspend"
---

Defined in: [packages/core/src/protocol/suspension.ts:92](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L92)

The marker value a tool's `execute` returns to request a replay-free mid-tool pause.

## Remarks

Returning this from a tool (Tier-1b) pauses the run: the loop suspends with the tool's
[SuspensionRequest](/reference/core/protocol/interfaces/suspensionrequest/), and `resume(token, { kind: "resolve", value })` feeds `value` back as the
tool result. The `execute` is not re-run on resume (the pause is replay-free).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Out` | The resolution type fed back as the tool result on resume. |

## Properties

### \_\_out?

```ts
readonly optional __out?: Out;
```

Defined in: [packages/core/src/protocol/suspension.ts:94](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L94)

***

### \[SUSPEND\]

```ts
readonly [SUSPEND]: true;
```

Defined in: [packages/core/src/protocol/suspension.ts:93](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L93)

***

### request

```ts
readonly request: SuspensionRequest;
```

Defined in: [packages/core/src/protocol/suspension.ts:95](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L95)
