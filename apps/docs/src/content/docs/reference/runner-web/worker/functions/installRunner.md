---
editUrl: false
next: false
prev: false
title: "installRunner"
---

```ts
function installRunner(scope, opts?): void;
```

Defined in: [runner-web/src/worker.ts:79](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/worker.ts#L79)

Wire the runner protocol onto a dedicated worker scope: listens for [RunnerRequest](/reference/runner-web/index/type-aliases/runnerrequest/)
messages, executes snippets, and posts [RunnerMessage](/reference/runner-web/index/type-aliases/runnermessage/)s back. Call once from the host
app's worker entry file.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `DedicatedWorkerGlobalScope` |
| `opts?` | [`InstallRunnerOptions`](/reference/runner-web/worker/interfaces/installrunneroptions/) |

## Returns

`void`
