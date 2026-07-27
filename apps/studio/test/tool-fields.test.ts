import { describe, expect, test } from "bun:test";
import { exampleError, exampleTemplate, paramsOf, parseExample, readNames, stubBody, toZod, tokenize, typeOfZod, type Param } from "../src/lib/tool-fields.ts";

describe("typeOfZod", () => {
  test("classifies the three field types", () => {
    expect(typeOfZod("z.string()")).toBe("text");
    expect(typeOfZod("z.number()")).toBe("number");
    expect(typeOfZod("z.boolean()")).toBe("boolean");
  });

  test("anything unrecognised falls back to text rather than throwing", () => {
    expect(typeOfZod("z.enum(['a','b'])")).toBe("text");
    expect(typeOfZod("")).toBe("text");
  });
});

describe("Fields ⇄ zod round trip", () => {
  const params: readonly Param[] = [
    { name: "city", type: "text", description: "e.g. Oslo" },
    { name: "days", type: "number", description: "" },
    { name: "metric", type: "boolean", description: "true for Celsius" },
  ];

  test("fields survive a trip through zod source unchanged", () => {
    expect(paramsOf(toZod(params))).toEqual(params);
  });

  test("an empty field list is a valid empty object, and reads back empty", () => {
    expect(toZod([])).toBe("z.object({})");
    expect(paramsOf("z.object({})")).toEqual([]);
  });

  test("descriptions are only emitted when non-empty", () => {
    expect(toZod([{ name: "a", type: "text", description: "" }])).toBe("z.object({ a: z.string() })");
  });

  test("a description containing quotes is escaped, not broken", () => {
    const tricky: readonly Param[] = [{ name: "q", type: "text", description: `say "hello", then stop` }];
    expect(paramsOf(toZod(tricky))).toEqual(tricky);
  });

  test("hand-written zod the field editor cannot model degrades to text, never crashes", () => {
    expect(paramsOf(`z.object({ mode: z.enum(["fast", "slow"]) })`)).toEqual([{ name: "mode", type: "text", description: "" }]);
  });
});

describe("readNames", () => {
  test("an input bound by the pattern and used in the body is read", () => {
    expect([...readNames("async ({ city }) => ({ city })", ["city"]).read]).toEqual(["city"]);
  });

  test("an input that only appears in the parameter list is NOT read", () => {
    // The whole point: destructuring every argument must not count as using it.
    expect([...readNames("async ({ city, unit }) => ({ ok: true })", ["city", "unit"]).read]).toEqual([]);
  });

  test("distinguishes read from unread across several inputs", () => {
    const { read } = readNames("async ({ city, unit }) => ({ where: city })", ["city", "unit"]);
    expect(read.has("city")).toBe(true);
    expect(read.has("unit")).toBe(false);
  });

  test("matches whole words only", () => {
    expect(readNames("async ({ city }) => ({ cityName: 1 })", ["city"]).read.has("city")).toBe(false);
  });

  test("code with no arrow is scanned whole rather than skipped", () => {
    expect(readNames("return city;", ["city"]).read.has("city")).toBe(true);
  });

  /*
   * The regression this exists for. The body mentions `personName`, but the pattern binds `input`, so the
   * call throws. Matching the body alone reported it as "1 of 1 input read" — a green badge on a
   * ReferenceError. Referenced-but-unbound must never be reported as read.
   */
  test("a name used but never bound is unbound, never read", () => {
    const { read, unbound } = readNames("async ({ input }) => ({ echoed: `${personName} is a nice person` })", ["personName"]);
    expect([...read]).toEqual([]);
    expect([...unbound]).toEqual(["personName"]);
  });

  test("binding the whole argument object reads fields through property access", () => {
    expect(readNames("async (args) => args.city", ["city"]).read.has("city")).toBe(true);
    expect(readNames('async (args) => args["city"]', ["city"]).read.has("city")).toBe(true);
    expect(readNames("async (args) => args.city", ["city"]).unbound.size).toBe(0);
  });

  test("a renamed field binds the new name, and claims nothing about the old one", () => {
    const { read, unbound } = readNames("async ({ city: c }) => c", ["city"]);
    expect(read.size).toBe(0);
    expect(unbound.size).toBe(0); // `city` is not referenced, so there is nothing to flag
  });

  test("a defaulted or rest binding still counts as bound", () => {
    expect(readNames("async ({ city = 'x' }) => city", ["city"]).read.has("city")).toBe(true);
  });
});

describe("tokenize", () => {
  test("splits a line into names and surrounding text, losslessly", () => {
    const toks = tokenize("return { city };", ["city"]);
    expect(toks.map((t) => t.text).join("")).toBe("return { city };");
    expect(toks.filter((t) => t.name !== null).map((t) => t.name)).toEqual(["city"]);
  });

  test("with no names nothing links, and the text survives", () => {
    const toks = tokenize("return {};", []);
    expect(toks.map((t) => t.text).join("")).toBe("return {};");
    expect(toks.every((t) => t.name === null)).toBe(true);
  });

  test("colours the line as TypeScript", () => {
    const toks = tokenize('const n = 2; // "x"', []);
    expect(toks.find((t) => t.text === "const")?.kind).toBe("key");
    expect(tokenize('return "hi";', []).find((t) => t.text === '"hi"')?.kind).toBe("str");
    expect(toks.find((t) => t.text === "2")?.kind).toBe("num");
    expect(tokenize("// note", [])).toEqual([{ text: "// note", name: null, kind: "com" }]);
  });

  test("matches whole identifiers only, so a prefix never shadows a longer name", () => {
    const toks = tokenize("return cityName;", ["city", "cityName"]);
    expect(toks.filter((t) => t.name !== null).map((t) => t.name)).toEqual(["cityName"]);
  });

  test("a name inside a string literal is coloured as string and never linked", () => {
    const toks = tokenize('return "city";', ["city"]);
    expect(toks.every((t) => t.name === null)).toBe(true);
    expect(toks.find((t) => t.text === '"city"')?.kind).toBe("str");
  });

  test("finds every occurrence and preserves the text exactly", () => {
    const line = "const r = await fetch(`/wx?q=${city}&u=${unit}`);";
    const toks = tokenize(line, ["city", "unit"]);
    expect(toks.map((t) => t.text).join("")).toBe(line);
    expect(toks.filter((t) => t.name !== null).map((t) => t.name)).toEqual(["city", "unit"]);
  });
});

describe("examples", () => {
  test("an example that contradicts the schema is rejected — it teaches a call the loop will refuse", () => {
    expect(exampleError('{"city":"Istanbul"}', ["city"])).toBeNull();
    expect(exampleError('{"town":"Istanbul"}', ["city"])).toContain("not in the schema");
    expect(exampleError("{}", ["city"])).toContain("missing");
    expect(exampleError("[1,2]", ["city"])).toBe("must be an object");
    expect(exampleError("{oops", ["city"])).toBe("not valid JSON");
  });

  test("an empty example is exactly right for a tool with no arguments", () => {
    expect(exampleError("{}", [])).toBeNull();
    expect(exampleTemplate([])).toEqual({});
  });

  test("a template covers every declared field", () => {
    const params: Param[] = [
      { name: "city", type: "text", description: "" },
      { name: "days", type: "number", description: "" },
      { name: "exact", type: "boolean", description: "" },
    ];
    expect(exampleTemplate(params)).toEqual({ city: "", days: 0, exact: false });
  });

  test("half-typed text never commits", () => {
    expect(parseExample('{"city":')).toBeUndefined();
    expect(parseExample('{"city":"x"}')).toEqual({ city: "x" });
  });
});

describe("stubBody — the one scaffold", () => {
  test("the parameter pattern is derived from the schema, so it can never disagree with it", () => {
    // Two scaffolds used to disagree: one hardcoded `{ input }` whatever the fields were. That mismatch is
    // how a body destructured `{ input }` while referencing `personName`.
    expect(readNames(stubBody(["personName"]), ["personName"]).unbound.size).toBe(0);
    expect(stubBody(["city", "days"])).toContain("{ city, days }");
  });

  test("a zero-argument tool gets an empty parameter list, not a phantom field", () => {
    expect(stubBody([])).toContain("async () =>");
  });

  test("it never invents data — the probe can tell it is unfinished", () => {
    expect(stubBody(["city"])).toContain("TODO: call your real");
    expect(stubBody(["city"])).toContain("{ ok: true }");
  });
});
