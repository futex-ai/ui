import { defineConfig, devices } from "@playwright/test";

const storybookPort =
  process.env.STORYBOOK_PORT ?? process.env.CONDUCTOR_PORT ?? "6006";
const storybookUrl = `http://127.0.0.1:${storybookPort}`;

// Baselines for the story snapshot sweep live next to the spec, keyed only by
// story id and the OS that rasterized them:
//
//   tests/browser/snapshots.spec.ts-snapshots/<story-id>-linux.png
//   tests/browser/snapshots.spec.ts-snapshots/<story-id>.aria.yml
//
// Both templates are set explicitly because Playwright's built-in defaults
// (`snapshotPathTemplate`) fold `{-projectName}` into the file name. The only
// project here is `chromium`, so that segment carries no information, and a
// later project rename would orphan every committed baseline. Pixels do depend
// on the OS text rasterizer, so screenshots keep a `{-platform}` suffix and are
// recorded on Linux; an accessibility tree does not, so ARIA snapshots have no
// suffix and are shared by every platform.
const snapshotsDir = "{snapshotDir}/{testFileDir}/{testFileName}-snapshots";

export default defineConfig({
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      pathTemplate: `${snapshotsDir}/{arg}{-platform}{ext}`,
    },
    toMatchAriaSnapshot: {
      pathTemplate: `${snapshotsDir}/{arg}{ext}`,
    },
  },
  testDir: "tests/browser",
  // `SNAPSHOT_UPDATE=1` is the one switch that re-records the story snapshot
  // sweep: `snapshotSharding.ts` reads it to collapse the sweep to a single
  // serial shard, and it also has to put Playwright itself into rewrite mode,
  // because the default (`missing`) leaves drifted baselines alone and reports
  // every newly written one as a failure.
  updateSnapshots: process.env.SNAPSHOT_UPDATE === "1" ? "changed" : undefined,
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
