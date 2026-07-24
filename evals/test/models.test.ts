import { afterEach, expect, test } from "bun:test";
import { LOCAL_MODELS, requiresWebGPU } from "@mithril/runner-web";
import { includeWebGPUModels, selectedModels } from "../src/models.ts";

const KEY = "MITHRIL_EVAL_INCLUDE_WEBGPU";
const FILTER = "MITHRIL_EVAL_MODELS";

afterEach(() => {
  delete process.env[KEY];
  delete process.env[FILTER];
});

test("includeWebGPUModels: opts in only for truthy env values", () => {
  delete process.env[KEY];
  expect(includeWebGPUModels()).toBe(false);
  for (const v of ["", "0", "false", "False"]) {
    process.env[KEY] = v;
    expect(includeWebGPUModels()).toBe(false);
  }
  for (const v of ["1", "true", "yes"]) {
    process.env[KEY] = v;
    expect(includeWebGPUModels()).toBe(true);
  }
});

test("selectedModels: excludes WebGPU-only models by default", () => {
  delete process.env[KEY];
  delete process.env[FILTER];
  const ids = selectedModels().map((m) => m.repoId);
  const gpuOnly = LOCAL_MODELS.filter((m) => requiresWebGPU(m));
  expect(gpuOnly.length).toBeGreaterThan(0); // guard: the fixture has at least one WebGPU-only model
  for (const m of gpuOnly) expect(ids).not.toContain(m.id);
});

test("selectedModels: includes WebGPU-only models when opted in", () => {
  process.env[KEY] = "1";
  const ids = selectedModels().map((m) => m.repoId);
  expect(ids.length).toBe(LOCAL_MODELS.length);
});

test("selectedModels: a filter matching only a WebGPU-only model yields nothing by default", () => {
  const gpuOnly = LOCAL_MODELS.find((m) => requiresWebGPU(m))!;
  process.env[FILTER] = gpuOnly.id;
  delete process.env[KEY];
  expect(selectedModels()).toHaveLength(0);
  // …but opting in surfaces it.
  process.env[KEY] = "1";
  expect(selectedModels().map((m) => m.repoId)).toContain(gpuOnly.id);
});
