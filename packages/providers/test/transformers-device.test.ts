import { expect, test } from "bun:test";
import { MithrilError } from "@mithril/core/agent";
import { backendError, chooseDevice, isNodeLike, wrapRuntimeError } from "../src/transformers/edge.ts";

// Pure device policy — the seam that makes onnxruntime-node work (it rejects "wasm"). See edge.ts.
test("chooseDevice: explicit pref always wins", () => {
  expect(chooseDevice({ pref: "cpu", webgpu: true, node: false })).toBe("cpu");
  expect(chooseDevice({ pref: "wasm", webgpu: true, node: true })).toBe("wasm");
  expect(chooseDevice({ pref: "webgpu", webgpu: false, node: true })).toBe("webgpu");
});

test("chooseDevice: WebGPU wins when available", () => {
  expect(chooseDevice({ webgpu: true, node: false })).toBe("webgpu");
  expect(chooseDevice({ webgpu: true, node: true })).toBe("webgpu");
});

test("chooseDevice: no WebGPU → cpu on Node/Bun, wasm in the browser", () => {
  expect(chooseDevice({ webgpu: false, node: true })).toBe("cpu"); // onnxruntime-node
  expect(chooseDevice({ webgpu: false, node: false })).toBe("wasm"); // onnxruntime-web
});

test("isNodeLike is true under the Bun test runtime", () => {
  expect(isNodeLike()).toBe(true);
});

// Proactive backend guard — refuses an unsupported device before downloading weights.
test("backendError: undefined when allowed is omitted/empty or device is allowed", () => {
  expect(backendError("m", "cpu", undefined)).toBeUndefined();
  expect(backendError("m", "cpu", [])).toBeUndefined();
  expect(backendError("m", "webgpu", ["webgpu"])).toBeUndefined();
  expect(backendError("m", "cpu", ["cpu", "wasm"])).toBeUndefined();
});

test("backendError: WEBGPU_REQUIRED for a WebGPU-only model on a non-WebGPU device", () => {
  const err = backendError("onnx-community/Ternary-Bonsai-8B-ONNX", "cpu", ["webgpu"]);
  expect(err).toBeInstanceOf(MithrilError);
  expect(err?.code).toBe("WEBGPU_REQUIRED");
  expect(err?.message).toContain("Ternary-Bonsai-8B-ONNX");
  expect(err?.message).toContain("WebGPU");
});

test("backendError: UNSUPPORTED_BACKEND for other backend mismatches", () => {
  const err = backendError("m", "cpu", ["wasm"]);
  expect(err?.code).toBe("UNSUPPORTED_BACKEND");
});

// Reactive net — a quantized-kernel crash on CPU/WASM becomes the same ergonomic WebGPU guidance.
test("wrapRuntimeError: quantized-kernel error on cpu → WEBGPU_REQUIRED", () => {
  const raw = new Error("Non-zero status code returned while running MatMulNBits node");
  const wrapped = wrapRuntimeError("m", "cpu", raw);
  expect(wrapped).toBeInstanceOf(MithrilError);
  expect((wrapped as MithrilError).code).toBe("WEBGPU_REQUIRED");
});

test("wrapRuntimeError: passes through unrelated errors and existing MithrilErrors", () => {
  const other = new Error("boom");
  expect(wrapRuntimeError("m", "cpu", other)).toBe(other);
  const mith = new MithrilError("SOME_CODE", "x");
  expect(wrapRuntimeError("m", "cpu", mith)).toBe(mith);
  // On webgpu, even a MatMulNBits error is left untranslated (WebGPU is the supported path).
  const kernel = new Error("MatMulNBits failed");
  expect(wrapRuntimeError("m", "webgpu", kernel)).toBe(kernel);
});
