import { expect, test } from "bun:test";
import { chooseDevice, isNodeLike } from "../src/transformers/edge.ts";

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
