---
editUrl: false
next: false
prev: false
title: "hasWebGPU"
---

```ts
function hasWebGPU(): Promise<boolean>;
```

Defined in: [runner-web/src/webgpu.ts:17](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/webgpu.ts#L17)

Resolve whether this runtime can actually run a WebGPU model — presence of `navigator.gpu` **and** a
grantable adapter (some browsers expose the API but hand back `null`, e.g. no compatible GPU / a policy
block). Never throws; a rejected/absent adapter resolves to `false`.

## Returns

`Promise`\<`boolean`\>
