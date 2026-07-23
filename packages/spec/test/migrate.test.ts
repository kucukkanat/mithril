import { describe, expect, test } from "bun:test";
import { migrateProject, SpecFormatError } from "../src/migrate.ts";
import { SPEC_VERSION } from "../src/types.ts";

const VALID = {
  specVersion: SPEC_VERSION,
  name: "p",
  decls: [],
  entry: { target: "a", input: "hi" },
};

describe("migrateProject", () => {
  test("accepts a current-version spec", () => {
    expect(migrateProject(VALID)).toEqual(VALID as never);
  });

  test("rejects a newer format with reason 'newer'", () => {
    try {
      migrateProject({ ...VALID, specVersion: SPEC_VERSION + 1 });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SpecFormatError);
      expect((e as SpecFormatError).reason).toBe("newer");
      expect((e as SpecFormatError).message).toContain("newer Studio");
    }
  });

  test.each([
    ["not an object", 42],
    ["missing specVersion", { name: "p", decls: [], entry: { target: "a", input: "x" } }],
    ["missing name", { specVersion: SPEC_VERSION, decls: [], entry: { target: "a", input: "x" } }],
    ["missing decls", { specVersion: SPEC_VERSION, name: "p", entry: { target: "a", input: "x" } }],
    ["missing entry target", { specVersion: SPEC_VERSION, name: "p", decls: [], entry: {} }],
  ])("rejects %s as malformed", (_label, raw) => {
    try {
      migrateProject(raw);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SpecFormatError);
      expect((e as SpecFormatError).reason).toBe("malformed");
    }
  });
});
