---
editUrl: false
next: false
prev: false
title: "ConnectionFault"
---

```ts
type ConnectionFault = "key" | "baseUrl" | "model" | "network" | "unknown";
```

Defined in: [runner-web/src/connection.ts:17](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L17)

Which field a failed probe points at, so the UI can mark the right input.
