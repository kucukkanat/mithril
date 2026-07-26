import { describe, expect, test } from "bun:test";
import { decodeLiteral, highlight, literalSlot } from "../src/components/CodeView.tsx";

const noop = (): void => undefined;

const text = (line: string): string =>
  highlight(line)
    .map((t) => t.text)
    .join("");

const kindOf = (line: string, needle: string): string | undefined => highlight(line).find((t) => t.text === needle)?.kind;

describe("highlight", () => {
  test("is lossless — the tokens always rebuild the line exactly", () => {
    for (const line of [
      `const assistant = agent({`,
      `  instructions: "Answer in one sentence.",`,
      `  model: transformers("onnx-community/Qwen3-0.6B-ONNX"),`,
      `  tools: [get_current_weather],`,
      `await run(assistant, "");`,
      `    return { tempC: 21.5, city };`,
      ``,
      `      `,
    ]) {
      expect(text(line)).toBe(line);
    }
  });

  test("colours keywords, calls, strings and numbers", () => {
    expect(kindOf("const a = agent({", "const")).toBe("key");
    expect(kindOf("const a = agent({", "agent")).toBe("fn");
    expect(kindOf(`  instructions: "hi",`, `"hi"`)).toBe("str");
    expect(kindOf("  maxSteps: 12,", "12")).toBe("num");
  });

  test("a comment line is one comment token", () => {
    expect(highlight("  // call your API here")).toEqual([{ kind: "com", text: "  // call your API here" }]);
  });

  test("keywords inside a string are NOT highlighted as keywords", () => {
    const toks = highlight(`  instructions: "return the const value",`);
    expect(toks.some((t) => t.kind === "key")).toBe(false);
    expect(toks.some((t) => t.kind === "str" && t.text.includes("return"))).toBe(true);
  });

  test("an escaped quote does not end the string early", () => {
    const line = `  description: "say \\"hi\\" first",`;
    expect(text(line)).toBe(line);
    expect(highlight(line).filter((t) => t.kind === "str")).toHaveLength(1);
  });

  test("template literals are treated as strings", () => {
    expect(kindOf("  const r = await fetch(`/wx?q=${city}`);", "`/wx?q=${city}`")).toBe("str");
  });

  test("a property name is not mistaken for a call", () => {
    expect(kindOf("  tools: [weather],", "tools")).toBe("plain");
    expect(kindOf("  tools: [weather],", "weather")).toBe("plain");
  });

  test("an empty line yields no tokens and still rebuilds", () => {
    expect(text("")).toBe("");
  });
});

describe("decodeLiteral", () => {
  test("decodes the escapes a generated string actually contains", () => {
    expect(decodeLiteral("plain")).toBe("plain");
    expect(decodeLiteral("say \\\"hi\\\"")).toBe('say "hi"');
    // the case that used to make a multi-line system prompt uneditable
    expect(decodeLiteral("one\\ntwo")).toBe("one\ntwo");
    expect(decodeLiteral("a\\\\b")).toBe("a\\b");
  });

  test("an escape half-typed is rejected rather than throwing", () => {
    expect(decodeLiteral("half\\")).toBeNull();
    expect(decodeLiteral('unquoted"break')).toBeNull();
  });

  test("empty is a valid literal, not a failure", () => {
    expect(decodeLiteral("")).toBe("");
  });
});

describe("literalSlot", () => {
  const editable = { job: { value: "one\ntwo", onChange: noop }, description: { value: "Current conditions", onChange: noop } };

  test("splits an editable line into prefix, body and tail", () => {
    expect(literalSlot(`  instructions: "one\\ntwo",`, editable)).toMatchObject({
      field: "job",
      prefix: "  instructions: ",
      body: "one\\ntwo",
      tail: ",",
    });
  });

  test("a trailing comma is optional", () => {
    expect(literalSlot(`  description: "Current conditions"`, editable)?.tail).toBe("");
  });

  test("no slot when the literal disagrees with the value we would write back", () => {
    expect(literalSlot(`  instructions: "something else",`, editable)).toBeNull();
  });

  test("no slot for a field the panel does not own — that line opens the editor instead", () => {
    expect(literalSlot(`  model: "gpt-4",`, editable)).toBeNull();
    expect(literalSlot(`import { agent } from "mithril";`, editable)).toBeNull();
    expect(literalSlot(`  inputSchema: z.object({ city: z.string() }),`, editable)).toBeNull();
  });

  test("a non-string value on an owned field is not editable in place", () => {
    expect(literalSlot(`  instructions: ["a", "b"].join("\\n"),`, editable)).toBeNull();
  });

  test("no editable map means nothing is editable", () => {
    expect(literalSlot(`  instructions: "one\\ntwo",`)).toBeNull();
  });
});
