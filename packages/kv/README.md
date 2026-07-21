# @mithril/kv

A runtime-agnostic `KeyValue` for tools — result caches, dedup sets, rate-limit counters, scratch state.
Inject it via your agent's deps and call `ctx.deps.kv` in a tool; swap the backend per runtime.

```ts
import { memoryKv } from "@mithril/kv";

const kv = memoryKv();
await kv.set("weather:NYC", { tempC: 21 }, { ttlMs: 60_000 });
await kv.get("weather:NYC"); // → { tempC: 21 } (undefined once expired)
await kv.has("weather:NYC"); // → true
```

Use it inside a tool via deps:

```ts
import { createHarness } from "mithril";
const { agent, tool } = createHarness<{ kv: KeyValue }>();

const cachedWeather = tool({
  name: "weather", description: "…", inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }, ctx) =>
    (await ctx.deps.kv.get(city)) ?? ctx.deps.kv.set(city, await fetchWeather(city)).then(() => fetchWeather(city)),
});
```

## API

`get<T>(key)` · `set(key, value, { ttlMs? })` · `delete(key)` · `has(key)`.

`memoryKv(now?)` takes an optional clock for deterministic TTL in tests.

### Backends (per-runtime subpaths)

The same interface + conformance suite, different storage:

```ts
import { memoryKv } from "@mithril/kv";              // everywhere (in-memory)
import { indexedDbKv } from "@mithril/kv/indexeddb"; // browser (persistent, per-origin)

const kv = indexedDbKv({ dbName: "my-app" });
await kv.set("session", { token }, { ttlMs: 3_600_000 });
```

`indexedDbKv({ dbName?, storeName?, now? })` is browser-only (needs the `indexedDB` global) and persists
across sessions per origin, with the same lazy-TTL semantics as `memoryKv`. SQLite/workerd-KV backends
follow the same pattern.
