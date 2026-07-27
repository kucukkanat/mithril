---
editUrl: false
next: false
prev: false
title: "ConnectionResult"
---

```ts
type ConnectionResult = 
  | {
  endpoint: string;
  latencyMs: number;
  ok: true;
}
  | {
  endpoint: string;
  fault: ConnectionFault;
  message: string;
  ok: false;
  status?: number;
};
```

Defined in: [runner-web/src/connection.ts:20](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L20)

The outcome of a [testConnection](/mithril/reference/runner-web/index/functions/testconnection/) probe.

## Union Members

### Type Literal

```ts
{
  endpoint: string;
  latencyMs: number;
  ok: true;
}
```

#### endpoint

```ts
readonly endpoint: string;
```

The endpoint actually called, so the UI can confirm an override took effect.

#### latencyMs

```ts
readonly latencyMs: number;
```

Round-trip time in ms — the useful half of a successful probe.

#### ok

```ts
readonly ok: true;
```

***

### Type Literal

```ts
{
  endpoint: string;
  fault: ConnectionFault;
  message: string;
  ok: false;
  status?: number;
}
```

#### endpoint

```ts
readonly endpoint: string;
```

#### fault

```ts
readonly fault: ConnectionFault;
```

Which input to blame; drives the inline error placement.

#### message

```ts
readonly message: string;
```

A message written for the person who has to fix it.

#### ok

```ts
readonly ok: false;
```

#### status?

```ts
readonly optional status?: number;
```

The HTTP status, when the request reached the server.
