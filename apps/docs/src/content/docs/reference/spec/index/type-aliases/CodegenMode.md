---
editUrl: false
next: false
prev: false
title: "CodegenMode"
---

```ts
type CodegenMode = "studio" | "export";
```

Defined in: [packages/spec/src/codegen.ts:29](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/codegen.ts#L29)

`"studio"` emits `await run(entry, input)` — the injected runner global of
`@mithril/runner-web`. `"export"` emits a standalone `main()` that calls `agent.run()` directly,
for a project a user downloads and runs with Bun/Node.
