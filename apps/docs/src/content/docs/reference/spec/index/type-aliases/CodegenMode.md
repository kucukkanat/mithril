---
editUrl: false
next: false
prev: false
title: "CodegenMode"
---

```ts
type CodegenMode = "studio" | "export";
```

Defined in: [packages/spec/src/codegen.ts:29](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/codegen.ts#L29)

`"studio"` emits `await run(entry, input)` — the injected runner global of
`@mithril/runner-web`. `"export"` emits a standalone `main()` that calls `agent.run()` directly,
for a project a user downloads and runs with Bun/Node.
