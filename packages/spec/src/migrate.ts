/*
 * Spec-version gate + migration chain. Every persisted or shared project passes through
 * `migrateProject` on load: older versions are upgraded step-by-step (v1 has no predecessors yet),
 * newer versions fail loud with a typed error the UI can explain ("made with a newer Studio").
 */

import { SPEC_VERSION, type ProjectSpec } from "./types.ts";

/** Thrown when a raw value cannot be understood as a {@link ProjectSpec}. */
export class SpecFormatError extends Error {
  override readonly name = "SpecFormatError";
  constructor(
    message: string,
    /** `"newer"` when the spec was written by a newer format than this library understands. */
    readonly reason: "newer" | "malformed",
  ) {
    super(message);
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Validate (and, once v2+ exists, upgrade) a raw parsed-JSON value into a {@link ProjectSpec}.
 * Throws {@link SpecFormatError} on anything it cannot understand — never returns a guess.
 */
export function migrateProject(raw: unknown): ProjectSpec {
  if (!isRecord(raw)) throw new SpecFormatError("Project spec must be a JSON object.", "malformed");
  const version = raw["specVersion"];
  if (typeof version !== "number") throw new SpecFormatError("Project spec is missing specVersion.", "malformed");
  if (version > SPEC_VERSION) {
    throw new SpecFormatError(
      `This project uses spec format v${version}, but this build only understands v${SPEC_VERSION} — it was made with a newer Studio.`,
      "newer",
    );
  }
  // v1 is the first format — no upgrade steps yet. Shallow-validate the load-bearing shape;
  // decl contents are trusted (they only ever feed codegen, which is string assembly).
  if (typeof raw["name"] !== "string") throw new SpecFormatError("Project spec is missing a name.", "malformed");
  if (!Array.isArray(raw["decls"])) throw new SpecFormatError("Project spec is missing decls.", "malformed");
  const entry = raw["entry"];
  if (!isRecord(entry) || typeof entry["target"] !== "string") {
    throw new SpecFormatError("Project spec is missing an entry target.", "malformed");
  }
  return raw as unknown as ProjectSpec;
}
