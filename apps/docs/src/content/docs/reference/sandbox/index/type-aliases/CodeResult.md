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

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/sandbox/src/index.ts#L14)

The outcome of a [CodeRunner.run](/reference/sandbox/index/interfaces/coderunner/#run): the returned value (on success) or an error, plus captured logs.
