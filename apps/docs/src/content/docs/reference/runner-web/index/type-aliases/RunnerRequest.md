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

Defined in: [runner-web/src/protocol.ts:49](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/protocol.ts#L49)

UI → worker.
