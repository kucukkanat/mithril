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

Defined in: [runner-web/src/protocol.ts:49](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/protocol.ts#L49)

UI → worker.
