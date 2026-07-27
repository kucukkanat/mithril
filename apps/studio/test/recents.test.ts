import { describe, expect, it } from "bun:test";
import { filterRecents, RECENTS_LIMIT } from "../src/lib/recents.ts";
import type { ProjectListEntry } from "../src/lib/db.ts";

const entry = (name: string, i: number): ProjectListEntry => ({ id: `p${i}`, name, updatedAt: 1000 - i });
const many = (n: number): readonly ProjectListEntry[] => Array.from({ length: n }, (_, i) => entry(`Agent ${i}`, i));

describe("filterRecents", () => {
  it("caps an empty query at the strip's limit", () => {
    expect(filterRecents(many(10), "")).toHaveLength(RECENTS_LIMIT);
    expect(filterRecents(many(10), "   ")).toHaveLength(RECENTS_LIMIT);
  });

  it("keeps everything when there are fewer than the limit", () => {
    expect(filterRecents(many(2), "")).toHaveLength(2);
  });

  it("matches case-insensitively on a substring of the name", () => {
    const list = [entry("Refund triage", 0), entry("Support router", 1)];
    expect(filterRecents(list, "REFUND").map((p) => p.id)).toEqual(["p0"]);
    expect(filterRecents(list, "rout").map((p) => p.id)).toEqual(["p1"]);
    expect(filterRecents(list, "nope")).toEqual([]);
  });

  it("searches past the limit so a match is never hidden by the cap", () => {
    const list = [...many(RECENTS_LIMIT), entry("Buried gem", 99)];
    expect(filterRecents(list, "buried").map((p) => p.name)).toEqual(["Buried gem"]);
  });
});
