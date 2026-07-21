# Mithril v1 — DX Roast (self-critique, 2026-07-20)

The validation rounds proved the API is *correct*. They said nothing about whether it's *pleasant*. Correct-but-miserable is the natural resting state of a framework designed to survive adversarial review — every hole gets plugged with a parameter, every parameter is defensible, and three sprints later the "hello world" is nine lines of ceremony. So here is the honest version: I optimized for **impressive in a design doc** over **quiet on a Tuesday**, and it shows in five places. Roast first, fixes after. Verdicts are what I'd actually change.

---

## 1. The first ten minutes are a boilerplate tax

The pitch is "an agent is a while loop." The reality of sending one message today:

```ts
// what the spec's own examples make you write
import { agent, tool } from "@mithril/core/agent";
import { providerRegistry } from "@mithril/providers";
import { anthropic } from "@mithril/providers/anthropic";

const assistant = agent()({ model: "anthropic/claude-fable-5", instructions: "..." });
const result = await assistant.run("Weather in Istanbul?", {
  deps: undefined,                       // I have no deps but must say so
  transport: { kind: "byok", apiKey: process.env.ANTHROPIC_API_KEY! },
  providers: providerRegistry(anthropic()),
});
```

Count the papercuts: (a) **`agent()({...})`** — a mysterious empty-parens curry with no explanation at the call site; (b) two **deep imports** from `@mithril/*` internals a newcomer should never see; (c) a **`providerRegistry(anthropic())`** ritual to connect a provider I already named in the model string; (d) a mandatory **`opts` object** with `deps: undefined` and a hand-built `transport` for the most trivial possible run. That is not a while loop. That is a form.

**Verdict — fix all four.** The 90% path must be:

```ts
import { agent } from "mithril";              // ONE import, the meta-package
import { anthropic } from "mithril/anthropic";

const assistant = agent({ model: anthropic("claude-fable-5"), instructions: "..." });
const result = await assistant.run("Weather in Istanbul?");   // env-based key, no opts
```

- `run(input)` with **no opts** is legal whenever the agent has no deps; transport falls back to `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in the environment (the Vercel-loved default). Opts stay available for everything else.
- `model:` accepts a **provider handle** (`anthropic("…")`) that self-wires and autocompletes the model names, *or* the bare `"anthropic/…"` string for config-driven selection. The `providerRegistry` ritual becomes advanced-only.

## 2. The curry is a type-system confession leaking into every call site

`agent<Deps>()`, `tool<Deps>()`, `definePlugin<Deps>()` — three factories that all make you write `<MyDeps>()` with an empty pair of parens, repeated at **every definition in the app**. It exists for a real reason (binding `Deps` positionally would kill `const Tools` capture). But that's my problem, not the user's, and I made it theirs, forty times per codebase.

**Verdict — bind deps once, not per-call.**

```ts
// before: every tool and agent restates <AppDeps>()
const search = tool<AppDeps>()({ ... });
const planner = agent<AppDeps>()({ ... });

// after: bind once at the top of the app; the trio is Deps-typed
import { createHarness } from "mithril";
const { agent, tool, plugin } = createHarness<AppDeps>();
const search = tool({ ... });       // ctx.deps is AppDeps, no per-call ceremony
const planner = agent({ ... });
```

`createHarness<Deps>()` is sugar over the curried primitives (which stay, for the rare mixed-deps case). One curry, once. This is the single biggest ergonomic win in the whole review.

## 3. `RunOptions` is an eleven-field junk drawer

`deps, transport, providers?, schemas?, persistence?, signal?, runtime?, threadId?, fanout?, depsDigest?, resumeOptions?`. Every `run()` call stares down eleven fields, ~seven of which are advanced or cross-process. Worst offender: **`depsDigest`** — I'm asking users to hand-maintain a stable version string for their dependency set so cross-process resume can sanity-check continuity. Nobody will do this. Everybody will get it wrong. It has no business in the type a beginner sees.

**Verdict:** demote the advanced fields. `depsDigest` moves into `resumeOptions` (the only place it matters) — the everyday `RunOptions` shrinks to `deps`, `transport?`, `signal?`, `threadId?`, `persistence?`. The cross-process/migration machinery lives behind `resumeOptions`, out of the beginner's eyeline. A per-run **timeout** is a first-class need and the answer is already web-standard — document `signal: AbortSignal.timeout(30_000)` as the idiom instead of leaving people to discover it.

## 4. Naming crimes

- **`useMithril`** — a React hook named after the vendor, telling the reader nothing. Vercel's `useChat`/`useCompletion` win because they name the *task*. → **`useRun`** (it consumes a `RunHandle`), plus a `useObject` for typed structured-output streaming, which is currently missing entirely — streaming a partial object drops you back to raw event-union filtering.
- **`MwContext`** — an abbreviation in a codebase whose own constitution says "clarity first." → **`MiddlewareContext`**.
- **`runLoop`** (the eject hatch) vs **`agent.run`** (the method) — two of the most important, most different concepts, one consonant apart. → rename the hatch **`agentLoop`**.
- **`tool` / `agent` / `definePlugin`** — two bare nouns and one `defineX` verb. Pick a lane. → **`plugin`**, so the `createHarness` trio is a clean `{ agent, tool, plugin }`.
- **`asTool({ name, description })`** hardcodes the sub-agent's input to `{ task: string }` — you can only ever hand a delegated agent a bare string. → let it take an optional `input` schema.

None of these change behavior. All of them change whether the code reads like a sentence.

## 5. The tooling story is asserted, not wired

The pitch is "zero-config local devtools: `bunx mithril dev`." But trace the actual connection: devtools live-tails via an `EventTransport`, which means to see anything I have to thread `fanout: someTransport` into my `RunOptions` by hand. That is not zero-config; that is BYO-plumbing with a CLI on top.

**Verdict:** ship a real zero-touch attach. `import "mithril/devtools/attach"` (or `MITHRIL_DEVTOOLS=1`) auto-fanouts **every** run in the process to the local inspector with no code change and tree-shakes out of production. The "React DevTools for agents" wedge is only real if it attaches like React DevTools — by being present, not by being wired into every call.

Two more tooling gaps worth naming honestly:
- **No error catalog.** Principle #1 promises "errors that tell you the fix," and then the spec specifies not a single error message. The biggest DX lever in the framework — what you see at 2am when `model: "anthropic/claude-fable-5"` throws because you forgot the registry — is unspecified. The revision adds an error-message appendix; treat it as a first-class deliverable, not a nicety.
- **`create-mithril` output is undefined.** The scaffolder is listed but nobody said what it produces. It must drop a *running* streaming chat in under ten lines from the meta-package — the first thing a new user sees is the strongest DX statement the project makes.

---

## Things I am deliberately NOT changing (and why)

A roast that changes everything is just as untrustworthy as one that changes nothing. These stay:

- **Three run methods (`run`/`stream`/`iterate`).** They return genuinely different shapes (promise / handle / step-generator). Collapsing them behind one overloaded method would trade a learnable trio for a confusing mega-signature. Keep — but document as a progression.
- **The `use: [...]` array mixing plugins and middleware with order-dependent flatten.** Order-dependence is a real footgun, but it's the honest model (guardrails genuinely must wrap compaction), and every alternative (named phases, priority numbers) is more machinery for less clarity. Keep — and earn it with a crisp ordering diagram in docs, not a config DSL.
- **Standard Schema instead of a bundled validator.** Raw Standard Schema is ugly to hand-write, but nobody hand-writes it — they bring Zod/Valibot. The zero-lock-in win is worth the "your first example imports zod" cost. Keep.
- **The monomorphic event wire.** It's the reason `tsc` stays fast; the local `narrow()` recovers types where you actually need them. The slight indirection is the price of not being the framework that melts the type-checker at 200 tools. Keep.

---

## Net

The architecture is sound; the *surface* was tuned for the review, not the user. The fixes above are almost all subtractive — fewer imports, fewer parens, fewer required fields, clearer names — which is the good kind of change to be making right before implementation. Applied set follows in the spec (§3, §9, §2); the ones that touch behavior (env-key fallback, devtools auto-attach) are flagged so they're built deliberately, not discovered.
