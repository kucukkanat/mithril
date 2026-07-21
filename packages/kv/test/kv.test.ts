import { expect, test } from "bun:test";
import { kvConformance, memoryKv } from "../src/index.ts";

kvConformance(async () => memoryKv(), { test, assertEqual: (a, b) => expect(a).toEqual(b as never) });

test("ttl honors an injected clock deterministically", async () => {
  let t = 1000;
  const kv = memoryKv(() => t);
  await kv.set("k", "v", { ttlMs: 100 });
  expect(await kv.has("k")).toBe(true); // t=1000, expires=1100
  t = 1200;
  expect(await kv.has("k")).toBe(false); // now past expiry
});
