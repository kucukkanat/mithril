#!/usr/bin/env bun
import { createApp, isTemplate, TEMPLATES } from "./index.ts";

const [, , nameArg, templateArg] = process.argv;
const name = nameArg ?? "my-agent";
const template = templateArg ?? "node-cli";

if (!isTemplate(template)) {
  console.error(`Unknown template "${template}". Choose one of: ${TEMPLATES.join(", ")}.`);
  process.exit(1);
}

const written = await createApp(template, name, name);
console.log(`Scaffolded "${name}" (${template}):`);
for (const f of written) console.log(`  ${name}/${f}`);
const next = template === "react-chat" ? "bun install  # then render <Chat /> with your bundler" : "bun install && OPENAI_API_KEY=… bun run start";
console.log(`\nNext:\n  cd ${name} && ${next}`);
