---
editUrl: false
next: false
prev: false
title: "Persistence"
---

Defined in: [packages/core/src/protocol/checkpointer.ts:70](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L70)

Opt-in durable persistence for a run, passed as `RunOptions.persistence`.

## Remarks

When present, the agent loop calls the [Checkpointer](/mithril/reference/core/protocol/interfaces/checkpointer/) automatically — no glue: a checkpoint is
written when the run reaches a terminal state or suspends, chained onto the run's prior checkpoint. A
`suspended` run stores its resumable token; terminal states (`completed`/`error`/`cancelled`) record the
outcome with a `null` token. Resume a suspended run in another process straight from storage with
Agent.resumeFrom / Agent.resumeStreamFrom — you never touch the token by hand.

`runId` makes a run addressable across processes: pass the same id on the original run and on
`resumeFrom(runId, …)`. Omitted ⇒ a fresh random id (fine for a single-process run, but you then need the
`runId` off the RunHandle to resume later). `seal`/`open` are an optional symmetric pair applied to
the token before it is stored and after it is loaded — supply them (e.g. wrapping [seal](/mithril/reference/core/protocol/interfaces/persistence/#seal)/[open](/mithril/reference/core/protocol/interfaces/persistence/#open))
to sign or encrypt state before it crosses a trust boundary; omitted ⇒ the token is stored as unsigned
`durable-local` JSON.

## Example

```ts
import { sqliteNodeCheckpointer } from "@mithril/memory/sqlite-node";
const persistence = { checkpointer: sqliteNodeCheckpointer("./runs.db"), runId: "order-42" };

const r = await agent.run("Refund order 42.", { persistence }); // auto-checkpointed
if (r.status === "suspended") {
  // …later, in another process, once a human approves:
  await agent.resumeFrom("order-42", { kind: "approve" }, { persistence });
}
```

## Properties

### checkpointer

```ts
readonly checkpointer: Checkpointer;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:72](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L72)

Where checkpoints are written and read.

***

### open?

```ts
readonly optional open?: (blob) => string | Promise<string>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:78](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L78)

Optional: reverse of `seal`, applied to a stored blob before resume (e.g. wrap [open](/mithril/reference/core/protocol/interfaces/persistence/#open)).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `blob` | `string` |

#### Returns

`string` \| `Promise`\<`string`\>

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:74](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L74)

Stable id addressing this run across processes; omitted ⇒ a fresh random id.

***

### seal?

```ts
readonly optional seal?: (token) => string | Promise<string>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:76](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L76)

Optional: seal the token before it is stored (e.g. wrap [seal](/mithril/reference/core/protocol/interfaces/persistence/#seal)); paired with `open`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |

#### Returns

`string` \| `Promise`\<`string`\>
