# @mithril/runner-web

Run Mithril agents **in the browser**, from source, with no build step.

Give it a string of TypeScript; it transpiles the snippet with sucrase inside a Web Worker, injects the
**real** `@mithril/*` packages through a `require` shim, and streams every `MithrilEvent` back to the main
thread. This is the engine behind both the docs playground and Mithril Studio — same implementation, so a
snippet behaves identically in either.

The package has two halves:

| Half | Import | Runs on |
| --- | --- | --- |
| Client (state machine + catalog) | `@mithril/runner-web` | Main thread |
| Worker (transpile + execute) | `@mithril/runner-web/worker` | Inside the worker |

## Usage

### 1. The worker entry

One file, so your bundler can see the worker. All the logic lives in the package:

```ts
// runner-worker.ts
import { installRunner } from "@mithril/runner-web/worker";

installRunner(self as unknown as DedicatedWorkerGlobalScope);
```

### 2. The client

`createRunnerClient` takes a `spawn` function and owns the worker lifecycle — a **fresh worker per run**
(clean state, and `terminate()` is a real kill switch for a runaway loop):

```ts
import { createRunnerClient } from "@mithril/runner-web";

const client = createRunnerClient(
  () => new Worker(new URL("./runner-worker.ts", import.meta.url), { type: "module" }),
);

client.subscribe(() => {
  const { status, events, logs, result } = client.getSnapshot();
  console.log(status, events.length, logs, result);
});

client.run(
  `
  import { agent } from "mithril";
  import { openai } from "mithril/openai";

  const greet = agent({ model: openai("gpt-4o"), instructions: "Be brief." });
  await run(greet, "Say hi in five words.");
  `,
  { env: { OPENAI_API_KEY: key } },
);
```

The snippet imports the **real** packages (`mithril`, `mithril/openai`, `@mithril/core/testkit`, `zod`, …)
through the shim. Two bindings come from the harness rather than an import: `run(agent, input, opts?)`,
which streams the agent into the snapshot, and `usage`, a default `UsageDelta` that keeps scripted model
turns terse.

`subscribe`/`getSnapshot` match `useSyncExternalStore`'s contract exactly, so a React host is a one-liner:

```tsx
const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
```

A listener that throws is isolated — it is reported via the global `reportError` (never swallowed), the
other listeners still run, and the client's own bookkeeping still happens.

### The snapshot

Every run accumulates into one immutable `RunnerSnapshot`:

```ts
interface RunnerSnapshot {
  status: "idle" | "running" | "suspended" | "done" | "error";
  events: readonly MithrilEvent[];  // the full typed event stream
  logs: readonly LogLine[];         // forwarded console.* from the snippet
  result: unknown;                  // the final RunResult (JSON-safe), or null
  error: string | null;
  errorHint: string | null;         // friendly explanation for common failures
  suspended: SuspendedInfo | null;  // pending HITL approval
  download: DownloadReport | null;  // local-model weight progress
  data: readonly unknown[];         // payloads from the emit() side-channel
}
```

### Run options, timeouts, and HITL

The watchdog is **idle-based** (reset by every worker message), not wall-clock, so a long-but-alive run is
never killed mid-stream:

```ts
client.run(code, {
  env: { ANTHROPIC_API_KEY: key },  // seeded into the worker's process.env
  idleTimeoutMs: 120_000,           // null disables it (e.g. unbounded weight downloads)
  timeoutMessage: "The provider took too long to respond.",
});

// when snapshot.suspended is set, answer it with an ApprovalDecision:
client.resume({ kind: "approve" });
// or { kind: "reject", message: "not authorized" } · { kind: "edit", input: { city: "Ankara" } }

client.stop();   // terminate, keep events/logs, status → "idle"
client.reset();  // terminate and clear back to IDLE_RUNNER_SNAPSHOT
```

### The shared model catalog

The headless half of the model picker — no React, so non-UI callers and tests can use it directly:

```ts
import {
  LIVE_PROVIDERS, liveProvider, LOCAL_MODELS, localModel,
  searchModels, testConnection, hasWebGPU,
} from "@mithril/runner-web";

liveProvider("deepseek").envVar;      // "DEEPSEEK_API_KEY"
searchModels(LOCAL_MODELS, "qwn3");   // fuzzy-matched, ranked

const probe = await testConnection({ provider: "openai", model: "gpt-4o", apiKey: key });
if (probe.ok) console.log(`${probe.latencyMs}ms via ${probe.endpoint}`);
```

An endpoint override travels with the key as `<PROVIDER>_BASE_URL` (read by core's `resolveTransport`)
rather than being baked into a snippet or a share URL.

## API

**Client** — `createRunnerClient(spawn): RunnerClient` · `IDLE_RUNNER_SNAPSHOT` ·
`describeRunnerError(raw): string | null`
**Worker** — `installRunner(scope, { extraModules? })` (from `@mithril/runner-web/worker`)
**Catalog** — `LIVE_PROVIDERS` · `liveProvider` · `LOCAL_MODELS` · `localModel` · `DEFAULT_LOCAL_MODEL` ·
`modelBackends` · `requiresWebGPU` · `ALL_BACKENDS`
**Search** — `searchModels` · `fuzzyScore` · `fuzzyPositions` · `isCustomModel`
**Connection** — `testConnection` · `fetchProviderModels` · `resolveBaseUrl` · `hasWebGPU`
**Types** — `RunnerClient`, `RunnerSnapshot`, `RunnerRunOptions`, `RunnerMessage`, `RunnerRequest`,
`RunStatus`, `LogLine`, `SuspendedInfo`, `DownloadReport`, `ResumeDirective`, `ResumeValue`,
`LiveProvider`, `LiveProviderId`, `LocalModel`, `CatalogModel`, `Backend`, `ProviderMode`, `ProviderWire`,
`ModelMatch`, `ConnectionProbe`, `ConnectionResult`, `ConnectionFault`.
