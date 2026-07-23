---
editUrl: false
next: false
prev: false
title: "SuspendedInfo"
---

Defined in: runner-web/src/protocol.ts:18

A pending human-in-the-loop suspension, as posted by the worker: the JSON-safe
[SuspensionDescriptor](https://mithril.dev/reference/core/)-shaped `request`, the
durable-local resume `token`, and the `runId` it belongs to (when the event stream carried one).

## Properties

### request

```ts
readonly request: unknown;
```

Defined in: runner-web/src/protocol.ts:19

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: runner-web/src/protocol.ts:21

***

### token

```ts
readonly token: string;
```

Defined in: runner-web/src/protocol.ts:20
