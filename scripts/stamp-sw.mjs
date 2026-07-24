import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "scripts/sw.template.js");
const outPath = join(root, "public/sw.js");

const buildId = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  `local-${Date.now()}`
).slice(0, 16);

const template = readFileSync(templatePath, "utf8");
const stamped = template.replaceAll("__PACT_BUILD_ID__", buildId);
writeFileSync(outPath, stamped);

console.log(`[stamp-sw] wrote public/sw.js with BUILD_ID=${buildId}`);
