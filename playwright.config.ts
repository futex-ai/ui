import { defineConfig, devices } from "@playwright/test";

const storybookPort =
  process.env.STORYBOOK_PORT ?? process.env.CONDUCTOR_PORT ?? "6006";
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
    command: `npm run storybook -- --ci --host 127.0.0.1 -p ${storybookPort}`,
    reuseExistingServer: !process.env.CI,
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
