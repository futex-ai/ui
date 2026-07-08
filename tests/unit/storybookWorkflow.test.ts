import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("close PR cleanup force-deletes preview aliases", () => {
  const source = readWorkflow();

  assert.match(source, /deployments\/\$\{deployment_id\}\?force=true/);
  assert.match(source, /failed_delete_count/);
  assert.match(
    source,
    /retained: failed to delete \$\{\s*failed_delete_count\s*\} Cloudflare deployment/,
  );
});

test("storybook deploys to the existing Futex Cloudflare Pages project", () => {
  const source = readWorkflow();

  assert.match(source, /CLOUDFLARE_PROJECT_NAME: futex-ui-storybook/);
  assert.match(
    source,
    /STORYBOOK_COMMENT_MARKER: "<!-- futex-ui-storybook-preview -->"/,
  );
  assert.doesNotMatch(source, /firna-ui-storybook/);
});

test("storybook PR preview deploy skips release-please PRs", () => {
  const source = readWorkflow();

  assert.match(
    source,
    /deploy-pr:[\s\S]*!\([\s\S]*startsWith\(github\.event\.pull_request\.head\.ref, 'release-please--'\)/,
  );
  assert.match(
    source,
    /deploy-pr:[\s\S]*contains\(join\(github\.event\.pull_request\.labels\.\*\.name, ','\), 'autorelease:'\)/,
  );
});

test("storybook close cleanup does not create inactive comments", () => {
  const source = readWorkflow();
  const closeCleanup = source.slice(
    source.indexOf("name: Mark preview inactive"),
  );

  assert.match(closeCleanup, /github\.rest\.issues\.updateComment/);
  assert.doesNotMatch(closeCleanup, /github\.rest\.issues\.createComment/);
});

function readWorkflow() {
  return readFileSync(
    new URL("../../.github/workflows/storybook.yml", import.meta.url),
    "utf8",
  );
}
