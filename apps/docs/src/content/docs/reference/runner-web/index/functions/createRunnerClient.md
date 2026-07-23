---
editUrl: false
next: false
prev: false
title: "createRunnerClient"
---

```ts
function createRunnerClient(spawn): RunnerClient;
```

Defined in: runner-web/src/client.ts:111

Create a [RunnerClient](/reference/runner-web/index/interfaces/runnerclient/) over a worker factory. The factory must return a module worker
whose entry calls `installRunner` (from `@mithril/runner-web/worker`) — each run spawns a fresh
one so terminate is always a safe kill switch.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spawn` | () => `Worker` |

## Returns

[`RunnerClient`](/reference/runner-web/index/interfaces/runnerclient/)

## Example

```ts
const client = createRunnerClient(
  () => new Worker(new URL("./worker-entry.ts", import.meta.url), { type: "module" }),
);
client.subscribe(() => render(client.getSnapshot()));
client.run(code, { env: { OPENAI_API_KEY: key } });
```
