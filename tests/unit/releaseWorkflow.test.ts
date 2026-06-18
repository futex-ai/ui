import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("release workflow uses release-please for node releases", () => {
  const workflow = readSource("../../.github/workflows/release.yml");

  assert.match(workflow, /name: Release/);
  assert.match(workflow, /branches:\s+- main/);
  assert.match(workflow, /uses: googleapis\/release-please-action@v4/);
  assert.match(workflow, /id: release/);
  assert.match(workflow, /release-type: node/);
  assert.match(
    workflow,
    /token: \$\{\{ secrets\.RELEASE_PLEASE_TOKEN \|\| secrets\.GITHUB_TOKEN \}\}/,
  );
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /id-token: write/);
});

test("release workflow publishes npm only after a release is created", () => {
  const workflow = readSource("../../.github/workflows/release.yml");
  const releaseCreated = "steps.release.outputs.release_created == 'true'";

  assert.match(workflow, /ref: \$\{\{ steps\.release\.outputs\.sha \}\}/);
  assert.equal(countMatches(workflow, new RegExp(releaseCreated, "g")), 10);
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /npm install --global npm@11\.7\.0/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.match(
    workflow,
    /RELEASE_TAG: \$\{\{ steps\.release\.outputs\.tag_name \}\}/,
  );
  assert.match(workflow, /cargo xtask check/);
  assert.match(workflow, /npm view "\@firna\/ui@\$\{PACKAGE_VERSION\}"/);
  assert.match(workflow, /npm publish --access public/);
});

test("release workflow no longer uses release-plz or Cargo version sync", () => {
  const workflow = readSource("../../.github/workflows/release.yml");

  assert.equal(existsSource("../../.github/workflows/release-plz.yml"), false);
  assert.equal(existsSource("../../release-plz.toml"), false);
  assert.doesNotMatch(workflow, /release-plz/);
  assert.doesNotMatch(workflow, /firna-ui-release/);
  assert.doesNotMatch(workflow, /sync-package-version/);
  assert.doesNotMatch(workflow, /prepare-release-pr/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function existsSource(relativePath: string) {
  return existsSync(new URL(relativePath, import.meta.url));
}

function countMatches(source: string, pattern: RegExp) {
  return Array.from(source.matchAll(pattern)).length;
}
