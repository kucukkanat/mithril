# `@mithril-internal/model-picker`

**The** model picker. One component, mounted by both the docs playground and the Studio, so the
two can never drift again.

Private and unpublished — like `@mithril-internal/design-tokens`, it exists to stop two apps
solving the same problem twice. It is styled entirely from design tokens, so it inherits whichever
host it is mounted in and looks right in both themes.

## What it does

- **Segments** — `scripted` / `live` / `local` / `code`. The host picks which to offer via `kinds`.
- **Fuzzy model search** — type any part of a model id (`haiku`, `4omini`, `s45`) to narrow the
  provider's list. Anything you type is used verbatim if it isn't in the list, and the UI says so.
- **Provider setup** — the API key, plus an **optional base URL** for pointing OpenAI-, Anthropic- or
  OpenAI-compatible providers at your own gateway.
- **Test connection** — one real one-token completion through the exact path a run takes, reporting
  which of key / endpoint / model is at fault.

## Usage

```tsx
import { ModelPicker, type ModelSelection } from "@mithril-internal/model-picker";
import "@mithril-internal/model-picker/model-picker.css";

function Example() {
  const [model, setModel] = useState<ModelSelection>({ kind: "live", provider: "openai", model: "gpt-4o-mini" });
  const [connections, setConnections] = useState({});

  return (
    <ModelPicker
      value={model}
      onChange={setModel}
      kinds={["live", "local"]}
      connections={connections}
      onConnectionChange={(id, patch) => setConnections((c) => ({ ...c, [id]: { ...c[id], ...patch } }))}
    />
  );
}
```

Turn the chosen connections into the env a run receives:

```ts
import { connectionEnv, providersOf, selectionEnv } from "@mithril-internal/model-picker";

connectionEnv("openai", { apiKey: "sk-…", baseUrl: "https://gw.internal/v1" });
// → { OPENAI_API_KEY: "sk-…", OPENAI_BASE_URL: "https://gw.internal/v1" }

selectionEnv(providersOf(model), connections); // → { env, missing }
```

Core's `resolveTransport` reads both vars, so the endpoint override reaches a real request by exactly
the route the key does — and neither value is ever written into generated code, a project spec, or a
share URL.

## Where the logic lives

The headless half is in **`@mithril/runner-web`**, not here — `LIVE_PROVIDERS` (the catalog, with each
provider's `defaultBaseUrl`, `supportsBaseUrl`, and curated `models`), `searchModels` / `fuzzyScore` /
`isCustomModel`, and `testConnection` / `fetchProviderModels` / `resolveBaseUrl`. That keeps it usable
from non-React callers and testable without a DOM; this package is only the UI over it.

## Adapting a host's own model type

The picker speaks its own `ModelSelection` (a superset of both hosts' types). Adapt at the boundary
rather than changing the picker — see `apps/studio/src/components/ModelPicker.tsx`, which maps
`@mithril/spec`'s `ModelSpec` both ways, and `apps/docs/src/components/ModelBar.tsx`, which maps the
playground's mode + provider + model triple.

## Tests

```sh
bun test apps/model-picker
```
