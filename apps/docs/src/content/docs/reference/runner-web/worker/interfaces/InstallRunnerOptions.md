---
editUrl: false
next: false
prev: false
title: "InstallRunnerOptions"
---

Defined in: [runner-web/src/worker.ts:27](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/worker.ts#L27)

Options for [installRunner](/mithril/reference/runner-web/worker/functions/installrunner/).

## Properties

### extraModules?

```ts
readonly optional extraModules?: Readonly<Record<string, unknown>>;
```

Defined in: [runner-web/src/worker.ts:32](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/worker.ts#L32)

Extra modules to expose to snippets (or overrides of the defaults). Keys are import
specifiers, values the evaluated module namespaces — merged over defaultModules.
