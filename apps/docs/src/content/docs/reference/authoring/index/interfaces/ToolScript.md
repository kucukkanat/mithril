---
editUrl: false
next: false
prev: false
title: "ToolScript"
---

Defined in: [script.ts:22](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/script.ts#L22)

A free JavaScript/TypeScript function body, executed through a CodeRunner.

## Properties

### kind

```ts
readonly kind: "script";
```

Defined in: [script.ts:23](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/script.ts#L23)

***

### language?

```ts
readonly optional language?: "js" | "ts";
```

Defined in: [script.ts:25](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/script.ts#L25)

Defaults to `"js"`; `"ts"` requires [ScriptOptions.transpile](/mithril/reference/authoring/index/interfaces/scriptoptions/#transpile).

***

### source

```ts
readonly source: string;
```

Defined in: [script.ts:27](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/script.ts#L27)

The body of an async function: reads the ambient `input`, and must `return` a JSON-safe value.

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: [script.ts:28](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/script.ts#L28)
