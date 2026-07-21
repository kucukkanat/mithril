# @mithril/react

Headless React bindings for streaming agent runs. The logic lives in a framework-agnostic **run store**
(`createRunStore`), so it's fully tested without a DOM; the hooks are thin `useSyncExternalStore` wrappers.

```tsx
import { useRun } from "@mithril/react/hooks";

function Chat({ assistant }) {
  const [handle, setHandle] = useState(null);
  const run = useRun(handle ?? EMPTY); // { text, status, state, events, costUsd }

  return (
    <>
      <button onClick={() => setHandle(assistant.stream("Weather in NYC?"))}>Ask</button>
      <pre>{run.text}</pre>
      <small>{run.status} · ${run.costUsd.toFixed(4)}</small>
    </>
  );
}
```

Prefer the store directly outside React (or to test):

```ts
import { createRunStore } from "@mithril/react";
const store = createRunStore(handle.events);
store.subscribe(() => render(store.getSnapshot()));
```

## API

- `@mithril/react` → `createRunStore(source)` → `{ subscribe, getSnapshot }`; `RunSnapshot = { state, text, status, events, costUsd }`.
- `@mithril/react/hooks` → `useRun(source)`, `useObject(source)` (streamed structured output). `react` is a peer dep.
