---
editUrl: false
next: false
prev: false
title: "ConnectionFault"
---

```ts
type ConnectionFault = "key" | "baseUrl" | "model" | "network" | "unknown";
```

Defined in: runner-web/src/connection.ts:17

Which field a failed probe points at, so the UI can mark the right input.
