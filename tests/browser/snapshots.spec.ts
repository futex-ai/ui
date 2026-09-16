import { expect, test, type APIRequestContext } from "@playwright/test";

import { storiesForShard } from "./a11ySharding";
import { snapshotOptOut, SNAPSHOT_OPT_OUTS } from "./snapshotOptOuts";
import { isRecordingSnapshots, snapshotSweepShards } from "./snapshotSharding";

/**
 * Data-driven visual and ARIA parity sweep over every Storybook story.
 *
 * The story list is discovered at run time from Storybook's `/index.json`, the
 * same way the axe sweep does, so a new story is pinned automatically with no
 * list to maintain. Each story renders alone in `/iframe.html?id=…` in a fresh
 * browser context, and is asserted twice: a full-viewport PNG against the
 * recorded baseline, and an ARIA snapshot of `#storybook-root` against the
 * recorded accessibility tree. Together they are the parity harness for the
 * pure React DOM backend (`plans/pure-react-dom-backend.md`): the screenshots
 * catch style-translation drift, the ARIA snapshots catch element-per-role and
 * attribute drift, and neither depends on the backend being `react-native-web`.
 *
 * Determinism comes from the context (fixed 900x600 viewport, `deviceScaleFactor
 * 1`, `reducedMotion: "reduce"`, forced light scheme, pinned locale and time
 * zone) plus `toHaveScreenshot`'s own stabilization loop. Stories that still
 * cannot be pinned are listed, with a reason each, in `snapshotOptOuts.ts`.
 *
 * Baselines are recorded on Linux and are Linux-only; macOS rasterizes text
 * differently and must not rewrite them. Re-record after an intentional visual
 * change with either of:
 *
 *   npx playwright test snapshots --update-snapshots   # four shards, faster
 *   SNAPSHOT_UPDATE=1 npx playwright test snapshots    # one serial sweep
 *
 * Assertions are soft, so one drifted story reports its diff without hiding the
 * rest of the shard: a single run tells you everything that moved.
 */

type StoryEntry = { id: string; type: string; name: string; title: string };

const SNAPSHOT_VIEWPORT = { height: 600, width: 900 };

/**
 * Let the story paint before its ARIA snapshot is read. `toHaveScreenshot` has
 * its own "shoot until two frames match" loop, but the first ARIA read during a
 * recording run has no retry to save it, and Storybook's mount can trail the
 * first child of `#storybook-root` by a frame.
 */
const STORY_SETTLE_MS = 150;

/** How long a story may take to mount before the sweep shoots it anyway. */
const STORY_MOUNT_MS = 30_000;

/**
 * Retry window for an ARIA snapshot that is being recorded rather than checked.
 *
 * Checking returns the moment the tree matches, so the default 10s expect
 * timeout costs nothing and buys a slow story room to settle. Recording always
 * costs the whole window: Playwright polls a deliberately unmatchable
 * placeholder until it gives up and writes what it saw. At 10s x 326 stories a
 * serial re-record would take an hour, so recording gets a short window — by
 * then the story has already survived the settle wait and the screenshot
 * matcher's own "shoot until two frames match" loop.
 */
const ARIA_RECORDING_TIMEOUT_MS = 2_000;

const recording = isRecordingSnapshots(process.env);
const sweepTimeout = recording ? 2_700_000 : 900_000;

async function discoverStories(
  request: APIRequestContext,
  baseURL: string | undefined,
): Promise<StoryEntry[]> {
  const indexResponse = await request.get(`${baseURL}/index.json`);
  expect(
    indexResponse.ok(),
    "Storybook /index.json should be served",
  ).toBeTruthy();
  const index = (await indexResponse.json()) as {
    entries?: Record<string, StoryEntry>;
  };
  const stories = Object.values(index.entries ?? {})
    .filter((entry) => entry.type === "story")
    .sort((a, b) => a.id.localeCompare(b.id));
  expect(stories.length, "Storybook should expose stories").toBeGreaterThan(0);
  return stories;
}

test.describe("Storybook visual and ARIA snapshot sweep", () => {
  test.describe.configure({
    mode: recording ? "serial" : "parallel",
  });

  for (const shard of snapshotSweepShards(recording)) {
    const shardLabel =
      shard.total === 1
        ? "all stories"
        : `shard ${shard.index + 1}/${shard.total}`;

    test(`matches the recorded baselines (${shardLabel})`, async ({
      browser,
      request,
      baseURL,
    }) => {
      test.setTimeout(sweepTimeout);

      const stories = await discoverStories(request, baseURL);
      const rewriting = ["all", "changed"].includes(
        test.info().config.updateSnapshots,
      );
      const ariaTimeout = rewriting ? ARIA_RECORDING_TIMEOUT_MS : undefined;
      const crashed: string[] = [];
      let skipped = 0;

      for (const story of storiesForShard(stories, shard)) {
        const optOut = snapshotOptOut(story.id);
        if (optOut?.scope === "story") {
          skipped += 1;
          continue;
        }

        // A fresh context per story keeps memory flat, isolates a crashing
        // story, and is where every determinism control is applied.
        const context = await browser.newContext({
          colorScheme: "light",
          deviceScaleFactor: 1,
          locale: "en-US",
          reducedMotion: "reduce",
          timezoneId: "UTC",
          viewport: SNAPSHOT_VIEWPORT,
        });
        const page = await context.newPage();
        try {
          await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
          // Generous, because this wait swallows its own timeout: the first
          // story a shard opens races Vite's on-demand transform of the whole
          // module graph on a cold dev server, and at 10s that race was lost
          // often enough to screenshot Storybook's "preparing story" spinner
          // and report it as a pixel diff. A story that genuinely renders
          // nothing still costs only this once.
          await page
            .waitForSelector("#storybook-root *", { timeout: STORY_MOUNT_MS })
            .catch(() => undefined);
          const fontsReady = await page.evaluate(async () => {
            await document.fonts.ready;
            // Ask for the face rather than waiting for the story to need it:
            // `check` answers for loaded faces only, and plenty of stories
            // render no 400-weight sans text at all.
            await document.fonts.load("400 16px Inter").catch(() => undefined);
            return document.fonts.check("400 16px Inter");
          });
          // Storybook bundles every font the stories can reach (see
          // `.storybook/fonts.ts`). If that bundle breaks, text silently falls
          // back to a machine-specific system font and a re-record would pin
          // the wrong glyphs everywhere, so fail loudly instead. Inter stands
          // in for the whole set: a story with no monospace or symbol text
          // never triggers those faces.
          expect
            .soft(
              fontsReady,
              `${story.id}: bundled Inter did not load, so this story would be ` +
                `rasterized with a system fallback font`,
            )
            .toBe(true);
          await page.waitForTimeout(STORY_SETTLE_MS);

          if (optOut?.scope === "screenshot") {
            skipped += 1;
          } else {
            await expect
              .soft(page, `${story.id} pixels`)
              .toHaveScreenshot(`${story.id}.png`, {
                animations: "disabled",
                caret: "hide",
                maxDiffPixelRatio: 0.002,
              });
          }

          if (optOut?.scope === "aria") {
            skipped += 1;
          } else {
            // Rooted at `body`, not `#storybook-root`: a modal, menu or toast
            // renders through a portal outside the story root and marks the
            // root `aria-hidden`, so ten stories snapshot as an empty tree from
            // the root and as the dialog or menu they actually present from
            // `body`. For the other stories the two roots are identical.
            await expect
              .soft(page.locator("body"), `${story.id} ARIA`)
              .toMatchAriaSnapshot({
                name: `${story.id}.aria.yml`,
                timeout: ariaTimeout,
              });
          }
        } catch (error) {
          crashed.push(`${story.id}: ${(error as Error).message}`);
        } finally {
          await context.close();
        }
      }

      test.info().annotations.push({
        type: "snapshot-sweep",
        description: `${shardLabel}: ${skipped} opt-out(s) skipped`,
      });

      // A crash means the story never rendered, so an empty/partial result is
      // not a pass.
      expect(
        crashed,
        `Stories that crashed during the snapshot sweep (nothing was compared — investigate):\n${crashed.join(
          "\n",
        )}`,
      ).toEqual([]);
    });
  }

  test("every snapshot opt-out still names a real story", async ({
    request,
    baseURL,
  }) => {
    const stories = await discoverStories(request, baseURL);
    const ids = new Set(stories.map((story) => story.id));
    const stale = Object.keys(SNAPSHOT_OPT_OUTS)
      .filter((id) => !ids.has(id))
      .sort();

    expect(
      stale,
      `Stale entries in tests/browser/snapshotOptOuts.ts — these story ids no ` +
        `longer exist, so the opt-out silently protects nothing:\n${stale.join(
          "\n",
        )}`,
    ).toEqual([]);
  });
});
