---
editUrl: false
next: false
prev: false
title: "RunnerRunOptions"
---

Defined in: [runner-web/src/client.ts:38](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/client.ts#L38)

Options for one [RunnerClient.run](/reference/runner-web/index/interfaces/runnerclient/#run) call.

## Properties

### env?

```ts
readonly optional env?: Readonly<Record<string, string>>;
```

Defined in: [runner-web/src/client.ts:40](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/client.ts#L40)

Keys to seed into the worker's `process.env` (the active provider's key only).

***

### idleTimeoutMs?

```ts
readonly optional idleTimeoutMs?: number | null;
```

Defined in: [runner-web/src/client.ts:45](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/client.ts#L45)

Kill the run after this many ms with NO worker message (idle watchdog). `null` disables the
watchdog entirely (e.g. unbounded local-model weight downloads). Default: 120 000.

***

### resume?

```ts
readonly optional resume?: ResumeDirective;
```

Defined in: [runner-web/src/client.ts:49](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/client.ts#L49)

Resume a persisted suspension instead of starting fresh (see [ResumeDirective](/reference/runner-web/index/interfaces/resumedirective/)).

***

### timeoutMessage?

```ts
readonly optional timeoutMessage?: string;
```

Defined in: [runner-web/src/client.ts:47](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/client.ts#L47)

The error message shown when the watchdog fires.
