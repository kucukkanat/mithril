---
editUrl: false
next: false
prev: false
title: "ResumeState"
---

Defined in: [packages/core/src/agent/loop.ts:152](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L152)

The reconstructed loop state driving a resume, assembled by [agent](/mithril/reference/core/agent/functions/agent/) from a run token.

## Properties

### messages

```ts
readonly messages: readonly LoopMessage[];
```

Defined in: [packages/core/src/agent/loop.ts:153](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L153)

***

### pending

```ts
readonly pending: PendingSuspension;
```

Defined in: [packages/core/src/agent/loop.ts:156](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L156)

***

### resolution

```ts
readonly resolution: ResumeValue;
```

Defined in: [packages/core/src/agent/loop.ts:157](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L157)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/loop.ts:155](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L155)

***

### tools?

```ts
readonly optional tools?: readonly ToolDefinition[];
```

Defined in: [packages/core/src/agent/loop.ts:159](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L159)

Tools the suspended run had created; rebuilt via `LoopOptions.materialize`. See [RunTokenV3](/mithril/reference/core/agent/interfaces/runtokenv3/).

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/agent/loop.ts:154](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L154)
