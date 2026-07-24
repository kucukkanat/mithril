---
editUrl: false
next: false
prev: false
title: "DownloadReport"
---

Defined in: [runner-web/src/protocol.ts:29](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L29)

A model-download progress report, mirrored from `@mithril/providers/transformers`'s
`ProgressReport` (structured-clone safe). Reported for local (in-browser) runs while
weights download or load; `progress` is an overall `0..1` fraction across files.

## Properties

### file?

```ts
readonly optional file?: string;
```

Defined in: [runner-web/src/protocol.ts:31](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L31)

***

### loaded

```ts
readonly loaded: number;
```

Defined in: [runner-web/src/protocol.ts:33](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L33)

***

### progress

```ts
readonly progress: number;
```

Defined in: [runner-web/src/protocol.ts:32](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L32)

***

### status

```ts
readonly status: string;
```

Defined in: [runner-web/src/protocol.ts:30](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L30)

***

### total

```ts
readonly total: number;
```

Defined in: [runner-web/src/protocol.ts:34](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/protocol.ts#L34)
