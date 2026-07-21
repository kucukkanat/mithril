#!/usr/bin/env bun
import { createApp, type Template } from "./index.ts";

const [, , nameArg, templateArg] = process.argv;
const name = nameArg ?? "my-agent";
const template = (templateArg ?? "node-cli") as Template;

const written = await createApp(template, name, name);
console.log(`Scaffolded "${name}" (${template}):`);
for (const f of written) console.log(`  ${name}/${f}`);
console.log(`\nNext:\n  cd ${name} && bun install && OPENAI_API_KEY=… bun run start`);
