---
editUrl: false
next: false
prev: false
title: "RunnerSnapshot"
---

Defined in: runner-web/src/client.ts:21

The accumulated state of the current (or last) run.

## Properties

### data

```ts
readonly data: readonly unknown[];
```

Defined in: runner-web/src/client.ts:34

Payloads received on the `emit()` side-channel, in arrival order.

***

### download

```ts
readonly download: 
  | DownloadReport
  | null;
```

Defined in: runner-web/src/client.ts:32

Local-model weight download/load progress, when a local run is fetching weights.

***

### error

```ts
readonly error: string | null;
```

Defined in: runner-web/src/client.ts:27

***

### errorHint

```ts
readonly errorHint: string | null;
```

Defined in: runner-web/src/client.ts:29

A friendly explanation for common failures (invalid key, CORS, rate limit); raw stays in `error`.

***

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: runner-web/src/client.ts:23

***

### logs

```ts
readonly logs: readonly LogLine[];
```

Defined in: runner-web/src/client.ts:24

***

### result

```ts
readonly result: unknown;
```

Defined in: runner-web/src/client.ts:26

The authoritative final RunResult posted by the injected `run()` (JSON-safe), or `null`.

***

### status

```ts
readonly status: RunStatus;
```

Defined in: runner-web/src/client.ts:22

***

### suspended

```ts
readonly suspended: 
  | SuspendedInfo
  | null;
```

Defined in: runner-web/src/client.ts:30
