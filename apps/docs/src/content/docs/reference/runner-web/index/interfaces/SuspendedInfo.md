---
editUrl: false
next: false
prev: false
title: "SuspendedInfo"
---

Defined in: [runner-web/src/protocol.ts:18](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/protocol.ts#L18)

A pending human-in-the-loop suspension, as posted by the worker: the JSON-safe
[SuspensionDescriptor](https://mithril.dev/reference/core/)-shaped `request`, the
durable-local resume `token`, and the `runId` it belongs to (when the event stream carried one).

## Properties

### request

```ts
readonly request: unknown;
```

Defined in: [runner-web/src/protocol.ts:19](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/protocol.ts#L19)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [runner-web/src/protocol.ts:21](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/protocol.ts#L21)

***

### token

```ts
readonly token: string;
```

Defined in: [runner-web/src/protocol.ts:20](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/protocol.ts#L20)
