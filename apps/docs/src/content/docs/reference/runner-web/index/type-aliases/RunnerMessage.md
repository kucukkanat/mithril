---
editUrl: false
next: false
prev: false
title: "RunnerMessage"
---

```ts
type RunnerMessage = 
  | {
  event: MithrilEvent;
  type: "event";
}
  | {
  level: LogLevel;
  text: string;
  type: "log";
}
  | {
  info: SuspendedInfo;
  type: "suspended";
}
  | {
  report: DownloadReport;
  type: "progress";
}
  | {
  result: unknown;
  type: "result";
}
  | {
  payload: unknown;
  type: "data";
}
  | {
  type: "done";
}
  | {
  message: string;
  type: "error";
};
```

Defined in: [runner-web/src/protocol.ts:62](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/protocol.ts#L62)

worker → UI.
