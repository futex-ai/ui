import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("release workflow uses release-please for node releases", () => {
  const workflow = readReleaseWorkflow();

  assert.match(workflow, /name: Release/);
  assert.match(workflow, /branches:\s+- main/);
  assert.match(workflow, /workflow_dispatch:[\s\S]*publish_ref:/);
  assert.match(workflow, /Existing vX\.Y\.Z tag to publish/);
  assert.match(workflow, /uses: googleapis\/release-please-action@v4/);
  assert.match(workflow, /if: github\.event_name == 'push'/);
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
  const workflow = readReleaseWorkflow();
  const shouldPublish = "steps.publish-target.outputs.should_publish == 'true'";

  assert.match(workflow, /id: publish-target/);
  assert.match(
    workflow,
    /RELEASE_CREATED: \$\{\{ steps\.release\.outputs\.release_created \}\}/,
  );
  assert.match(
    workflow,
    /RELEASE_SHA: \$\{\{ steps\.release\.outputs\.sha \}\}/,
  );
  assert.match(
    workflow,
    /RELEASE_TAG: \$\{\{ steps\.release\.outputs\.tag_name \}\}/,
  );
  assert.match(
    workflow,
    /ref: \$\{\{ steps\.publish-target\.outputs\.ref \}\}/,
  );
  assert.ok(countOccurrences(workflow, shouldPublish) >= 8);
  assert.doesNotMatch(
    workflow,
    /if: steps\.release\.outputs\.release_created == 'true'/,
  );
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /npm install --global npm@11\.7\.0/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.match(
    workflow,
    /RELEASE_TAG: \$\{\{ steps\.publish-target\.outputs\.tag \}\}/,
  );
  assert.match(workflow, /cargo xtask check/);
  assert.match(workflow, /npm view "\@firna\/ui@\$\{PACKAGE_VERSION\}"/);
  assert.match(workflow, /npm publish --access public/);
});

test("release workflow can retry publishing an existing tag", () => {
  const workflow = readReleaseWorkflow();

  assert.match(workflow, /workflow_dispatch:[\s\S]*publish_ref:/);
  assert.match(workflow, /required: true/);
  assert.match(
    workflow,
    /PUBLISH_REF: \$\{\{ github\.event\.inputs\.publish_ref \|\| '' \}\}/,
  );
  assert.match(
    workflow,
    /if \[ "\$\{EVENT_NAME\}" = "workflow_dispatch" \]; then/,
  );
  assert.match(workflow, /Invalid publish ref/);
  assert.match(workflow, /echo "ref=\$\{PUBLISH_REF\}"/);
  assert.match(workflow, /echo "tag=\$\{PUBLISH_REF\}"/);
});

test("release workflow keeps the trusted npm publisher filename", () => {
  assert.equal(existsSource("../../.github/workflows/release-plz.yml"), true);
  assert.equal(existsSource("../../.github/workflows/release.yml"), false);
});

test("release workflow no longer uses release-plz action or Cargo version sync", () => {
  const workflow = readReleaseWorkflow();

  assert.doesNotMatch(workflow, /uses: release-plz\/action/);
  assert.equal(existsSource("../../release-plz.toml"), false);
  assert.doesNotMatch(workflow, /firna-ui-release/);
  assert.doesNotMatch(workflow, /sync-package-version/);
  assert.doesNotMatch(workflow, /prepare-release-pr/);
});

function readReleaseWorkflow() {
  return readSource("../../.github/workflows/release-plz.yml");
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function existsSource(relativePath: string) {
  return existsSync(new URL(relativePath, import.meta.url));
}

function countOccurrences(source: string, needle: string) {
  return source.split(needle).length - 1;
}
