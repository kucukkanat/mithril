---
editUrl: false
next: false
prev: false
title: "RunSource"
---

Defined in: [hooks.ts:24](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/react/src/hooks.ts#L24)

Anything carrying a run event stream — notably a `RunHandle`, which satisfies this shape.

## Remarks

Accepted by [useRun](/reference/react/hooks/functions/userun/) and [useObject](/reference/react/hooks/functions/useobject/); typically `agent.stream(input)`.

## Properties

### events

```ts
readonly events: AsyncIterable<MithrilEvent>;
```

Defined in: [hooks.ts:26](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/react/src/hooks.ts#L26)

The run's event stream.
