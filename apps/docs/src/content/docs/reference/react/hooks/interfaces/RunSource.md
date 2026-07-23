---
editUrl: false
next: false
prev: false
title: "RunSource"
---

Defined in: [hooks.ts:24](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/react/src/hooks.ts#L24)

Anything carrying a run event stream — notably a `RunHandle`, which satisfies this shape.

## Remarks

Accepted by [useRun](/reference/react/hooks/functions/userun/) and [useObject](/reference/react/hooks/functions/useobject/); typically `agent.stream(input)`.

## Properties

### events

```ts
readonly events: AsyncIterable<MithrilEvent>;
```

Defined in: [hooks.ts:26](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/react/src/hooks.ts#L26)

The run's event stream.
