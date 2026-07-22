---
editUrl: false
next: false
prev: false
title: "attachDevtools"
---

```ts
function attachDevtools(): () => void;
```

Defined in: [packages/devtools/src/attach.ts:36](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/devtools/src/attach.ts#L36)

Attach the global devtools inspector to every run in this process (idempotent).

## Returns

a detach function that unregisters the fanout and closes the broadcast channel.

() => `void`

## Remarks

Normally you don't call this — `import "mithril/devtools/attach"` runs it for you. It registers a
process-wide registerGlobalConsumer that forwards events to [getGlobalInspector](/reference/devtools/index/functions/getglobalinspector/) and, in a
browser, to a [DEVTOOLS\_CHANNEL](/reference/devtools/attach/variables/devtools_channel/) `BroadcastChannel`.
