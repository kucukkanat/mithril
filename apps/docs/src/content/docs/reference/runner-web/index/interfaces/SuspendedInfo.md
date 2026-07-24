---
editUrl: false
next: false
prev: false
title: "SuspendedInfo"
---

Defined in: [runner-web/src/protocol.ts:18](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/runner-web/src/protocol.ts#L18)

A pending human-in-the-loop suspension, as posted by the worker: the JSON-safe
[SuspensionDescriptor](https://mithril.dev/reference/core/)-shaped `request`, the
durable-local resume `token`, and the `runId` it belongs to (when the event stream carried one).

## Properties

### request

```ts
readonly request: unknown;
```

Defined in: [runner-web/src/protocol.ts:19](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/runner-web/src/protocol.ts#L19)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [runner-web/src/protocol.ts:21](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/runner-web/src/protocol.ts#L21)

***

### token

```ts
readonly token: string;
```

Defined in: [runner-web/src/protocol.ts:20](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/runner-web/src/protocol.ts#L20)
