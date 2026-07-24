---
editUrl: false
next: false
prev: false
title: "RunnerRequest"
---

```ts
type RunnerRequest = 
  | {
  code: string;
  env?: Readonly<Record<string, string>>;
  resume?: ResumeDirective;
  type: "run";
}
  | {
  decision: ResumeValue;
  type: "resume";
};
```

Defined in: [runner-web/src/protocol.ts:49](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L49)

UI → worker.
