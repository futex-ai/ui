import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("browser tests isolate the Storybook server port per workspace", () => {
  const config = readSource("../../playwright.config.ts");

  assert.match(config, /PLAYWRIGHT_STORYBOOK_PORT/);
  assert.match(config, /workspaceStorybookPort/);
  assert.match(config, /--port \$\{storybookPort\}/);
  assert.match(config, /reuseExistingServer: false/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
