---
editUrl: false
next: false
prev: false
title: "RunOptions"
---

Defined in: [index.ts:19](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/sandbox/src/index.ts#L19)

Options for a single [CodeRunner.run](/mithril/reference/sandbox/index/interfaces/coderunner/#run).

## Properties

### globals?

```ts
readonly optional globals?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:23](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/sandbox/src/index.ts#L23)

Extra values injected as globals into the execution scope (e.g. inputs the code may read).

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: [index.ts:21](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/sandbox/src/index.ts#L21)

Wall-clock budget for synchronous execution, in milliseconds (default 1000).
