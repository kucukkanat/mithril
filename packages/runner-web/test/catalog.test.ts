import { expect, test } from "bun:test";
import { ALL_BACKENDS, LOCAL_MODELS, modelBackends, requiresWebGPU } from "../src/catalog.ts";

test("modelBackends: unrestricted models default to ALL_BACKENDS", () => {
  const cpuModel = LOCAL_MODELS.find((m) => m.backends === undefined);
  expect(cpuModel).toBeDefined();
  expect(modelBackends(cpuModel!)).toBe(ALL_BACKENDS);
  // Unknown/free-text ids are treated as unrestricted too.
  expect(modelBackends("some/unknown-model")).toBe(ALL_BACKENDS);
});

test("modelBackends: honors a declared restriction (by model and by repo id)", () => {
  const gpuOnly = LOCAL_MODELS.find((m) => m.backends?.length === 1 && m.backends[0] === "webgpu");
  expect(gpuOnly).toBeDefined();
  expect(modelBackends(gpuOnly!)).toEqual(["webgpu"]);
  expect(modelBackends(gpuOnly!.id)).toEqual(["webgpu"]);
});

test("requiresWebGPU: true only for models restricted to exactly ['webgpu']", () => {
  const gpuOnly = LOCAL_MODELS.find((m) => m.backends?.length === 1 && m.backends[0] === "webgpu");
  expect(requiresWebGPU(gpuOnly!)).toBe(true);
  const unrestricted = LOCAL_MODELS.find((m) => m.backends === undefined);
  expect(requiresWebGPU(unrestricted!)).toBe(false);
});

test("catalog: the Ternary Bonsai 8B entry is flagged WebGPU-only", () => {
  const ternary = LOCAL_MODELS.find((m) => m.id === "onnx-community/Ternary-Bonsai-8B-ONNX");
  expect(ternary).toBeDefined();
  expect(ternary?.dtype).toBe("q2f16");
  expect(requiresWebGPU(ternary!)).toBe(true);
});
