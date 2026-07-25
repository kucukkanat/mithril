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

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/sandbox/src/index.ts#L14)

The outcome of a [CodeRunner.run](/mithril/reference/sandbox/index/interfaces/coderunner/#run): the returned value (on success) or an error, plus captured logs.
