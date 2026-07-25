---
editUrl: false
next: false
prev: false
title: "ToolScript"
---

Defined in: script.ts:22

A free JavaScript/TypeScript function body, executed through a CodeRunner.

## Properties

### kind

```ts
readonly kind: "script";
```

Defined in: script.ts:23

***

### language?

```ts
readonly optional language?: "js" | "ts";
```

Defined in: script.ts:25

Defaults to `"js"`; `"ts"` requires [ScriptOptions.transpile](/mithril/reference/authoring/index/interfaces/scriptoptions/#transpile).

***

### source

```ts
readonly source: string;
```

Defined in: script.ts:27

The body of an async function: reads the ambient `input`, and must `return` a JSON-safe value.

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: script.ts:28
