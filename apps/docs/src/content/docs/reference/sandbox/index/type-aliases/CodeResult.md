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

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/sandbox/src/index.ts#L14)

The outcome of a [CodeRunner.run](/reference/sandbox/index/interfaces/coderunner/#run): the returned value (on success) or an error, plus captured logs.
