# @mithril/memory

`Checkpointer` implementations for persisting and resuming agent runs — plus the conformance kit every
backend must pass.

```ts
import { memoryCheckpointer } from "@mithril/memory";
import { sqliteBunCheckpointer } from "@mithril/memory/sqlite-bun"; // durable, Bun

const cp = memoryCheckpointer(); // dev / tests; runs in any runtime

// You store a run's (sealed) token; you resume from it later.
await cp.put({ runId, checkpointId, parentId: null, token, status: "suspended", createdAt });
const latest = await cp.latest(runId); // → CheckpointRecord | undefined
```

## Backends

| Import | Runtime | Notes |
|---|---|---|
| `@mithril/memory` → `memoryCheckpointer()` | any | in-memory; the reference impl |
| `@mithril/memory/sqlite-bun` → `sqliteBunCheckpointer(path? | { path? })` | Bun | durable; `:memory:` by default |
| `@mithril/memory/sqlite-node` → `sqliteNodeCheckpointer(path? | { path? })` | Node ≥ 22.5 | durable; built-in `node:sqlite` |

Both pass the same suite:

```ts
import { checkpointerConformance, memoryCheckpointer } from "@mithril/memory";
import { test, expect } from "bun:test";
checkpointerConformance(async () => memoryCheckpointer(), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
```

## API

- `put(rec, { ifParent? })` → `"ok" | "conflict"` — idempotent on `checkpointId`; `ifParent` gives optimistic concurrency.
- `latest(runId)`, `get(runId, checkpointId)`, `history(runId)` (async-iterable, insertion order), `purge(runId)`.

A `Checkpointer` is just where *you* store the opaque run token from a suspended run — it stays decoupled
from the loop. Pair it with `seal`/`open` from `@mithril/core/agent` for authenticated, tamper-evident tokens.
