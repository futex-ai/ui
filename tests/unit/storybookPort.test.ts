import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("browser tests use a workspace-specific Storybook port when available", () => {
  const source = readFileSync(
    new URL("../../playwright.config.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /process\.env\.STORYBOOK_PORT \?\? process\.env\.CONDUCTOR_PORT \?\? "6006"/,
  );
  assert.match(source, /baseURL: storybookUrl/);
  assert.match(source, /-p \$\{storybookPort\}/);
  assert.match(source, /url: storybookUrl/);
});
