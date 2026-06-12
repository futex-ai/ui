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

function readWorkflow() {
  return readFileSync(
    new URL("../../.github/workflows/storybook.yml", import.meta.url),
    "utf8",
  );
}
