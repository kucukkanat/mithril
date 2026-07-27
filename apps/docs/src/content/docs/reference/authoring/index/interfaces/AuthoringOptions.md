---
editUrl: false
next: false
prev: false
title: "AuthoringOptions"
---

Defined in: [index.ts:41](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L41)

Options for [toolAuthoring](/mithril/reference/authoring/index/functions/toolauthoring/).

## Properties

### materializers?

```ts
readonly optional materializers?: Materializers;
```

Defined in: [index.ts:65](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L65)

Extra body-kind builders, keyed by `body.kind`, for body formats of your own.

***

### maxTools?

```ts
readonly optional maxTools?: number;
```

Defined in: [index.ts:56](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L56)

Cap on tools this run may author (default 16).

#### Remarks

Every registered tool costs tokens on **every** step, so an unbounded registry silently
inflates the cost of the whole run. `revoke_tool` is how the agent makes room.

***

### requireApprovalToDefine?

```ts
readonly optional requireApprovalToDefine?: boolean;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L49)

Require human approval before a tool is defined (default `true`).

#### Remarks

Setting this to `false` lets an agent grant itself capabilities with no human in the loop. It is
supported for trusted, non-interactive pipelines; it is not a safe default and is never inferred.

***

### scope?

```ts
readonly optional scope?: string | ((ctx) => string);
```

Defined in: [index.ts:82](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L82)

Which partition of the store this agent uses. **Required** whenever `store` is set.

#### Remarks

Not defaulted on purpose: a silent shared namespace across agents is a footgun. Scope per
agent or per tenant — never per run, which would make persistence identical to the ephemeral tier.

***

### script?

```ts
readonly optional script?: ScriptOptions;
```

Defined in: [index.ts:63](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L63)

Enable Tier-2 script bodies by supplying a `CodeRunner`.

#### Remarks

Opt-in, because executing a model-written function body is a materially different risk from
composing tools the agent already has. See [ScriptOptions](/mithril/reference/authoring/index/interfaces/scriptoptions/) — in particular `allowLocalRunner`.

***

### store?

```ts
readonly optional store?: StoreSelector;
```

Defined in: [index.ts:75](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L75)

Persist authored tools so the toolbox survives past one run.

#### Remarks

A function form receives `{ deps, runId }`, which is what makes a multi-tenant host able to pick a
store per run. It is passed here rather than through `RunOptions` because a store is a property of
*this agent's authoring policy*, not of an individual run — and rather than being read off `Deps`,
which would force a framework-shaped field into every consumer's DI contract.
