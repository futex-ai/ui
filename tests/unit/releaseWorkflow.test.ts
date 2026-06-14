import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("release-plz workflow uses manual release PR merges", () => {
  const config = readSource("../../release-plz.toml");
  const workflow = readSource("../../.github/workflows/release-plz.yml");

  assert.match(config, /release_always = false/);
  assert.match(config, /git_only = true/);
  assert.match(workflow, /command: release-pr/);
  assert.match(workflow, /cargo xtask sync-package-version --version/);
  assert.match(workflow, /package\.json package-lock\.json/);
});

test("npm publish workflow uses trusted publishing and idempotency", () => {
  const workflow = readSource("../../.github/workflows/npm-publish.yml");

  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /npm install --global npm@11\.7\.0/);
  assert.match(workflow, /npm view "\@firna\/ui@\$\{PACKAGE_VERSION\}"/);
  assert.match(workflow, /npm publish --access public/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
