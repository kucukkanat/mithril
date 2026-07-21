import { expect, test } from "bun:test";
import { cosineSimilarity, memoryVectorStore, vectorsConformance } from "../src/index.ts";

vectorsConformance(async () => memoryVectorStore(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b),
  assertTrue: (v, m) => expect(v, m).toBe(true),
});

test("cosineSimilarity: identical direction ≈ 1, orthogonal = 0, zero-vector = 0", () => {
  expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
});
