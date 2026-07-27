---
editUrl: false
next: false
prev: false
title: "CodegenMode"
---

```ts
type CodegenMode = "studio" | "export";
```

Defined in: [packages/spec/src/codegen.ts:30](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/codegen.ts#L30)

`"studio"` emits `await run(entry, input)` — the injected runner global of
`@mithril/runner-web`. `"export"` emits a standalone `main()` that calls `agent.run()` directly,
for a project a user downloads and runs with Bun/Node.
