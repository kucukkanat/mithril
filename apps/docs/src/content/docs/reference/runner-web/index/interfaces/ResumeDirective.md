---
editUrl: false
next: false
prev: false
title: "ResumeDirective"
---

Defined in: [runner-web/src/protocol.ts:43](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/protocol.ts#L43)

Resume a previously suspended run from a persisted token instead of starting fresh.
When present on a `run` request, the injected `run()` global ignores its `input` and calls
`agent.resumeStream(token, decision)` on the reconstructed agent — this is what makes
resume-across-page-reload possible: the code re-provides the behavior, the token provides the state.

## Properties

### decision

```ts
readonly decision: ResumeValue;
```

Defined in: [runner-web/src/protocol.ts:45](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/protocol.ts#L45)

***

### token

```ts
readonly token: string;
```

Defined in: [runner-web/src/protocol.ts:44](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/protocol.ts#L44)
