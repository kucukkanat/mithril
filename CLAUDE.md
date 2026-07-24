# CLAUDE.md — Mithril

Guidance for anyone (human or AI) developing this repo. The user's global constitution still
applies (Bun runtime/PM/test-runner, strict TypeScript, minimize dependencies, design tokens,
tests for everything, ESM-only, conventional commits, **ask before non-trivial decisions**). This
file adds project-specific rules — the most important of which is: **the docs must never drift
from the code.**

## What this is

- **Mithril** — a batteries-included, provider-agnostic TypeScript AI-agent harness. Public
  contract is one typed event stream (`MithrilEvent`); runs on Node, Bun, and browsers.
- **`packages/*`** — the framework (`@mithril/core`, `providers`, `memory`, `kv`, `fs`,
  `otel`, `workflows`, `mcp`, `react`, the `mithril` meta-package, `create-mithril`). Source-as-
  published ESM, strict `exports` maps, zero runtime deps in core.
- **`apps/docs`** — the documentation website (Astro + Starlight + React). A private, unpublished
  workspace; its toolchain never leaks into the libraries.
- **`docs/design/*`** — the locked v1 spec, validation report, and DX roast. The spec is the design
  source of truth; **the source code is the API source of truth.**

---

## Prime directive: no documentation drift

Docs describe **only what is verified against `packages/*/src` today.** Not the READMEs (they have
drifted), not memory, not the spec's aspirations. When code and docs disagree, the code wins and
the docs get fixed.

### The reference is GENERATED — document in the source

The whole `/reference/*` section is **generated from the framework source** by TypeDoc
(`starlight-typedoc`, one instance per package → clean `/reference/<pkg>/…` URLs). **Do not
hand-write reference pages, and do not edit `apps/docs/src/lib/symbols.ts` — both are generated.**

To document or change an API, edit the **TSDoc** (`/** … */`) on the export's declaration in
`packages/*/src`: a one-line summary, `@param`/`@returns`, an `@example`, `{@link OtherSymbol}`
cross-links, and `@remarks` for any not-shipped caveat. That TSDoc also powers editor IntelliSense
for framework users, so it's the right home. Then regenerate (below).

### The lockstep rule

**Any change to a package's public API ships with the matching docs change in the same commit.**
When you add / rename / remove / re-signature an exported symbol, or change runtime behavior:

1. **TSDoc in source** — update the `/** … */` on the declaration in `packages/*/src`. The
   reference page, cross-links, and hover tooltips all regenerate from it.
2. **Regenerate** (see next section) so `reference/` markdown and `symbols.ts` reflect the change.
3. **Guide(s)** — hand-written; update any `guides/*.mdx` that shows the old shape.
4. **Concept page(s)** — if a core principle/type changed.
5. **Playground** — `apps/docs/src/playground/presets.ts` (provider-agnostic `ExampleParts`, assembled
   by `providers.ts`) if an example preset used the old API.
6. **Roadmap** — `apps/docs/src/content/docs/roadmap.mdx` if you shipped / deferred something.

### Regenerating the reference

It's a **single build** — `bun run docs:build` does everything: TypeDoc emits `reference/` from the
source TSDoc, the `mithril-gen-symbols` Astro integration then writes `src/lib/symbols.json` from
that reference (on `astro:config:done`, before rendering), and the link plugins read it lazily. So
after a source/TSDoc change, just:

```sh
bun run docs:build          # regenerates reference/ + symbols.json + applies links, in one pass
bun run docs:check-symbols  # verifies every generated symbol link resolves to a built page
```

`symbols.json` and `reference/<pkg>/` are **generated artifacts** — never hand-edit them. (`bun run
gen-symbols` regenerates just the registry from an existing `reference/`, if you ever need it.)

### Accuracy laws

- **Implemented-first.** Document what works. Anything not shipped goes on the **Roadmap** page and
  is never presented as working. Use an `<Aside type="note">` linking `/roadmap/` where a reader
  might expect the feature.
- **Verify against source, not memory.** Before documenting a symbol, read its definition in
  `packages/*/src`. `grep` the real `export`s.
- **No overclaiming.** Every claim must be literally true of the current code. (Examples of drift
  we've already fixed: the suspend token is unsigned `durable-local`, not auto-HMAC; `resume()`
  returns a final `RunResult`, it does not re-stream; `agentLoop` takes `middlewares`/`consumers`,
  not `use:`; the decision type is `ApprovalDecision` with a **required** `message`.)
- **Playground examples are real and runnable.** Every preset (and every `<Runnable>` snippet)
  imports the real packages and must actually run in the in-browser worker — verify it before
  merging.

### Currently NOT shipped — keep on Roadmap only

The `bunx mithril dev` CLI wrapper for the Studio (the Studio itself SHIPS as the client-only
`apps/studio` — design/run with two-way code view; its canvas and share/export are
in flight) and realtime/voice (v2); ANN-indexed `vectors` backends
(sqlite-vec / pgvector / Vectorize) and a WASM `sandbox` backend; local-inference upgrades — a
WASM/CPU-guaranteed backend (wllama) and native constrained/grammar decoding for hard structured-output
guarantees on local models; and the Chrome Prompt API provider. (Nested-`asTool` HITL resume through
the parent's own token IS shipped — do not list it here. Durable persistence wired into `run()` also
ships now — the loop auto-checkpoints via `run(input, { persistence })` and `resumeFrom` — so do not
list it here either.)

---

## Verification gates (run before calling docs work done)

```sh
bun test              # framework — must stay green (all pass)
bun run typecheck     # framework — strict tsc across all packages, exit 0
bun run check:browser-safe  # runtime-agnostic gate: no browser entrypoint statically imports a Node/Bun builtin
bun run docs:build    # docs build clean; Pagefind search + llms.txt generated
bun run docs:check    # docs `astro check` — 0 errors, 0 warnings (the docs quality bar)
bun run docs:check-symbols  # every generated symbol link resolves to a built page (run after build)
bun run docs:check-pages    # every content page is reachable from the sidebar (no orphans/dangling entries)
```

**Editing docs must never change `packages/*`.** If a docs task seems to need a framework change,
stop and raise it — that's a framework change with its own review, not a docs edit.

**Runtime-agnostic rule.** A browser-reachable package entry must never *statically* `import` a
Node/Bun builtin (`node:*`, `bun:*`) — a bundler externalizes it and the module throws in the
browser even when the Node path never runs (this is what broke the playground). Put Node-only code
behind a dynamic `await import("node:…")`, or move it to a `*-node` / `*/server` subpath (which the
`exports` map and `check:browser-safe` both treat as Node-only). `bun run check:browser-safe`
enforces this over every browser-declared entrypoint.

---

## Docs-site conventions (`apps/docs`)

- **Stack**: Astro + Starlight + `@astrojs/react` islands. Playground/editor deps (CodeMirror,
  sucrase, zod) are confined to `apps/docs` only.
- **Framework resolution**: Vite `resolve.alias` (in `astro.config.mjs`) maps every `@mithril/*`
  entrypoint to its source `.ts`, so docs type-check and the playground bundle the *real* code.
  Add an alias when you reference a new subpath.
- **Design is dark-first & metallic ("mithril silver"), with a light mode.** Style **only** with
  the design tokens in `src/styles/tokens.css` (semantic tokens like `--bg`, `--text`, `--accent`).
  Never hard-code a hex in a component — add a token. Both themes must look right.
- **Content structure**: hand-written `getting-started/` → `concepts/` (the 9 pillars) →
  `guides/` (task-oriented) → `design/` → `roadmap`, plus the **generated** `reference/` (TypeDoc)
  and one hand-written `reference.mdx` landing. Frontmatter on hand-written pages: `title`,
  `description`, `sidebar: { order, label? }`. **Never edit files under `reference/<pkg>/`** — they
  are TypeDoc output (regenerated on build).
- **Adding a page = adding it to the sidebar.** `getting-started/`, `concepts/`, and `design/` are
  `autogenerate`d, so a new file appears automatically. **`guides/` is a curated list in
  `astro.config.mjs`** (grouped by intent; frontmatter `order` is *ignored* there) — a new guide is
  reachable by URL but **invisible in navigation until you add its slug** (e.g. `"guides/foo"`) to
  the right group. `bun run docs:check-pages` fails on any orphaned page or dangling entry, so run it
  (it's a verification gate) whenever you add, rename, or delete a page.
- **MDX**: use Starlight components (`Aside`, `Steps`, `Tabs`, `CardGrid`, `LinkCard`). For a
  runnable scripted example use `<Runnable code={…} />` (`src/components/Runnable.astro`) — it
  deep-links into the playground. Use plain ` ```ts ` fences for non-runnable / real-provider code
  (Starlight adds copy buttons). Cross-link with root-absolute hrefs (`/guides/…`, `/concepts/…`).
- **Playground** (`src/playground/`): CodeMirror editor → sucrase transpile in a **Web Worker** →
  a `require` shim injects the real `@mithril/*` + `zod` → an injected `run(agent, input, opts?)`
  streams events; `usage` is an injected default UsageDelta. It has **three run targets** (the
  ModelBar picker): **scripted** (offline test double — zero network, zero keys, the default),
  **live** (BYOK — the user's key is injected as `process.env.<PROVIDER>_API_KEY` and sent straight
  to the real provider), and **local** (an on-device Transformers.js model — one-time weight
  download, then no network). Presets in `presets.ts` are provider-agnostic `ExampleParts`
  (`bodyImports` + `scriptedTurns` + `body`); `providers.ts`'s `assembleExample(parts, target)` slots
  in the model line per target, so one preset runs against all three. "Zero network, zero keys" holds
  for **scripted mode only**.
- **Adding a local model** (`src/playground/providers.ts` `LOCAL_MODELS`, and the local-inference
  guide): the provider loads every model via `AutoModelForCausalLM` (text-only), so before adding
  one — verify against the **raw HF API** that `pipeline_tag` is `text-generation` (a vision /
  `image-text-to-text` repo loads but emits garbage), confirm its chat template emits a tool grammar
  the parser knows (`<tool_call>` / `<|tool_call_start|>` / gemma tokens), and **run it through the
  tool-use test harness** before shipping — a family name is not a guarantee (several look-alikes
  scored 0/4). Pin a `dtype` for fp16-fragile archs (Mamba/hybrid, e.g. Granite → `q4`) or
  single-dtype repos (e.g. Qwen3-4B ships q4f16 only → pin `q4f16`).
- **Symbol links + tooltips**: `src/lib/symbols.json` is **generated** during the build (by
  `scripts/gen-symbols.ts` via the `mithril-gen-symbols` integration) from the TypeDoc reference
  (name → generated-page URL + kind + signature) — do not hand-edit it. `load-symbols.ts` reads it
  lazily. `rehype-symbol-links.ts` links inline-code symbol mentions in prose (styled popover
  tooltip); `ec-symbol-links.ts` (an Expressive Code plugin) links symbols inside code examples
  (native `title` tooltip, syntax color preserved).
- **AI-friendly**: `/llms.txt` is generated from the content collection; keep page `description`s
  meaningful.

---

## Preferences locked in this conversation

- **Accuracy over completeness.** A smaller, true doc beats a larger, aspirational one. Honest
  roadmap, always.
- **Best-in-class DX is a feature.** Instant search, copy buttons, dark/light, `llms.txt`,
  docs↔playground deep-links, and the live playground are load-bearing, not decoration.
- **Reference symbols are navigable.** Types/methods/classes are inline-linked to their reference,
  with hover tooltips showing their definition — in prose **and** in code examples. New public
  symbols must be added to `symbols.ts`.
- **Cover common tasks with runnable examples.** If a reader would reasonably ask "how do I X?"
  (e.g. chat history, HITL, structured output), there should be a guide section **and** a
  playground preset for it.
- **Dark, metallic, precise identity.** Keep it.

## Known placeholders to fix before deploy

- `apps/docs/astro.config.mjs`: the GitHub `social` URL (`github.com/mithril-ai/mithril`) and
  `site: "https://mithril.dev"` are placeholders — set to real values.
- Repo is not git-initialized yet. Work on a branch and use Conventional Commits once it is; commit
  only when asked.
