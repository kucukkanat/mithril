---
editUrl: false
next: false
prev: false
title: "RunTokenV3"
---

Defined in: [packages/core/src/agent/loop.ts:186](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L186)

The current run token: [RunTokenV2](/mithril/reference/core/agent/interfaces/runtokenv2/) plus the tools the run created.

## Remarks

The definitions ride the token *as well as* the `tool.registered` events, and both are needed. The
events are what let `replay(log)` reconstruct the registry; the token is what lets `resume()` work in a
process that never saw the log — the loop is handed only the token string on that path. Neither alone
covers both cases, and the duplication is one JSON record per authored tool.

## Properties

### messages

```ts
readonly messages: readonly LoopMessage[];
```

Defined in: [packages/core/src/agent/loop.ts:190](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L190)

***

### model

```ts
readonly model: string;
```

Defined in: [packages/core/src/agent/loop.ts:189](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L189)

***

### pending

```ts
readonly pending: PendingSuspension;
```

Defined in: [packages/core/src/agent/loop.ts:193](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L193)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/agent/loop.ts:188](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L188)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/loop.ts:192](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L192)

***

### tools?

```ts
readonly optional tools?: readonly ToolDefinition[];
```

Defined in: [packages/core/src/agent/loop.ts:195](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L195)

Every non-static tool the run held at suspend time, in registration order.

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/agent/loop.ts:191](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L191)

***

### v

```ts
readonly v: 3;
```

Defined in: [packages/core/src/agent/loop.ts:187](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L187)
