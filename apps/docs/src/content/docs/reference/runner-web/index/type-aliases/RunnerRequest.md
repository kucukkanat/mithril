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

Defined in: [runner-web/src/protocol.ts:49](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/protocol.ts#L49)

UI → worker.
