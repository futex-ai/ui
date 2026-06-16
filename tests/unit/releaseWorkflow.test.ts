import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("release-plz workflow supports squash-merged release PRs", () => {
  const config = readSource("../../release-plz.toml");
  const workflow = readSource("../../.github/workflows/release-plz.yml");

  assert.match(config, /release_always = true/);
  assert.doesNotMatch(config, /release_always = false/);
  assert.match(config, /git_only = true/);
  assert.match(workflow, /command: release-pr/);
  assert.match(workflow, /id: release-source/);
  assert.match(workflow, /commits\/\$\{GITHUB_SHA\}\/pulls/);
  assert.match(workflow, /startswith\(\$prefix\)/);
  assert.match(
    workflow,
    /if: steps\.release-source\.outputs\.release_pr == 'true'/,
  );
  assert.equal(
    countMatches(
      workflow,
      /if: steps\.release-plz\.outputs\.prs_created == 'true'/g,
    ),
    4,
  );
  assert.doesNotMatch(workflow, /if: steps\.release-plz\.outputs\.pr != ''/);
  assert.match(workflow, /cargo xtask prepare-release-pr --version/);
  assert.match(
    workflow,
    /refs\/heads\/\$\{branch\}:refs\/remotes\/origin\/\$\{branch\}/,
  );
  assert.match(
    workflow,
    /git checkout -B "\$\{branch\}" "origin\/\$\{branch\}"/,
  );
  assert.match(workflow, /CHANGELOG\.md package\.json package-lock\.json/);
});

test("release-plz workflow formats generated release PR files", () => {
  const workflow = readSource("../../.github/workflows/release-plz.yml");

  assert.match(workflow, /name: Prepare generated release PR files/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /cargo xtask prepare-release-pr --version/);
  assert.match(
    workflow,
    /git diff --quiet -- CHANGELOG\.md package\.json package-lock\.json/,
  );
  assert.match(
    workflow,
    /git add CHANGELOG\.md package\.json package-lock\.json/,
  );
  assert.match(workflow, /chore: prepare release PR files/);
});

test("release-plz workflow publishes npm after creating a release", () => {
  const workflow = readSource("../../.github/workflows/release-plz.yml");

  assert.match(workflow, /publish_ref:/);
  assert.match(workflow, /releases_created:/);
  assert.match(workflow, /steps\.release-plz\.outputs\.releases_created/);
  assert.match(workflow, /needs\.release\.outputs\.releases_created == 'true'/);
  assert.match(
    workflow,
    /steps\.release-source\.outputs\.release_pr == 'true' && steps\.release-plz\.outputs\.releases_created == 'true'/,
  );
  assert.match(workflow, /workflow_dispatch.+inputs\.publish_ref/s);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /npm install --global npm@11\.7\.0/);
  assert.match(workflow, /cargo xtask check/);
  assert.match(workflow, /npm view "\@firna\/ui@\$\{PACKAGE_VERSION\}"/);
  assert.match(workflow, /npm publish --access public/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function countMatches(source: string, pattern: RegExp) {
  return Array.from(source.matchAll(pattern)).length;
}
