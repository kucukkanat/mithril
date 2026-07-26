---
editUrl: false
next: false
prev: false
title: "installRunner"
---

```ts
function installRunner(scope, opts?): void;
```

Defined in: [runner-web/src/worker.ts:79](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/runner-web/src/worker.ts#L79)

Wire the runner protocol onto a dedicated worker scope: listens for [RunnerRequest](/mithril/reference/runner-web/index/type-aliases/runnerrequest/)
messages, executes snippets, and posts [RunnerMessage](/mithril/reference/runner-web/index/type-aliases/runnermessage/)s back. Call once from the host
app's worker entry file.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `DedicatedWorkerGlobalScope` |
| `opts?` | [`InstallRunnerOptions`](/mithril/reference/runner-web/worker/interfaces/installrunneroptions/) |

## Returns

`void`
