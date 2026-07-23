---
editUrl: false
next: false
prev: false
title: "RunnerSnapshot"
---

Defined in: [runner-web/src/client.ts:21](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L21)

The accumulated state of the current (or last) run.

## Properties

### data

```ts
readonly data: readonly unknown[];
```

Defined in: [runner-web/src/client.ts:34](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L34)

Payloads received on the `emit()` side-channel, in arrival order.

***

### download

```ts
readonly download: 
  | DownloadReport
  | null;
```

Defined in: [runner-web/src/client.ts:32](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L32)

Local-model weight download/load progress, when a local run is fetching weights.

***

### error

```ts
readonly error: string | null;
```

Defined in: [runner-web/src/client.ts:27](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L27)

***

### errorHint

```ts
readonly errorHint: string | null;
```

Defined in: [runner-web/src/client.ts:29](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L29)

A friendly explanation for common failures (invalid key, CORS, rate limit); raw stays in `error`.

***

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [runner-web/src/client.ts:23](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L23)

***

### logs

```ts
readonly logs: readonly LogLine[];
```

Defined in: [runner-web/src/client.ts:24](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L24)

***

### result

```ts
readonly result: unknown;
```

Defined in: [runner-web/src/client.ts:26](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L26)

The authoritative final RunResult posted by the injected `run()` (JSON-safe), or `null`.

***

### status

```ts
readonly status: RunStatus;
```

Defined in: [runner-web/src/client.ts:22](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L22)

***

### suspended

```ts
readonly suspended: 
  | SuspendedInfo
  | null;
```

Defined in: [runner-web/src/client.ts:30](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L30)
