import { createHash } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

const STORYBOOK_PORT_BASE = 16_000;
const STORYBOOK_PORT_SPAN = 20_000;

const storybookPort =
  process.env.PLAYWRIGHT_STORYBOOK_PORT ?? workspaceStorybookPort();
const storybookUrl = `http://127.0.0.1:${storybookPort}`;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: "tests/browser",
  use: {
    baseURL: storybookUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run storybook -- --ci --host 127.0.0.1 --port ${storybookPort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    url: storybookUrl,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

function workspaceStorybookPort() {
  const digest = createHash("sha256").update(process.cwd()).digest();
  return String(
    STORYBOOK_PORT_BASE + (digest.readUInt16BE(0) % STORYBOOK_PORT_SPAN),
  );
}
