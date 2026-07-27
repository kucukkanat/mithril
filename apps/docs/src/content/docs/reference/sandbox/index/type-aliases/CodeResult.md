---
editUrl: false
next: false
prev: false
title: "CodeResult"
---

```ts
type CodeResult = 
  | {
  logs: readonly string[];
  ok: true;
  value: unknown;
}
  | {
  error: string;
  logs: readonly string[];
  ok: false;
};
```

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/sandbox/src/index.ts#L14)

The outcome of a [CodeRunner.run](/mithril/reference/sandbox/index/interfaces/coderunner/#run): the returned value (on success) or an error, plus captured logs.
