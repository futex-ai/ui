import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Data-driven WCAG 2.1 A/AA sweep over every Storybook story.
 *
 * The story list is discovered at run time from Storybook's `/index.json`, so new
 * stories are scanned automatically with no list to maintain. Each story is
 * rendered in isolation (`/iframe.html?id=…`) in its OWN page and scanned with
 * axe-core against the WCAG 2.0/2.1 A and AA rule tags. A fresh page per story
 * keeps memory flat across the ~50-story sweep (one long-lived page accumulates
 * enough to crash the Chromium tab) and isolates a crash to a single story.
 *
 * Known, triaged violations live in `axe-baseline.json` keyed by story id → the
 * axe rule ids accepted for that story (e.g. RNW emitting `aria-prohibited-attr`
 * on a labelled container). The gate fails only on a (story, rule) pair that is
 * NOT in the baseline, so it blocks regressions while letting the baseline be
 * burned down over time. Regenerate the baseline after intentional changes with:
 *
 *   UPDATE_A11Y_BASELINE=1 npm run test:browser -- a11y.spec.ts
 *
 * axe is a static scanner: it sees only the currently-rendered DOM. Dynamic
 * behaviour (keyboard nav, focus trap/restore, live-region announcements) is
 * asserted by the interaction tests in `storybook.spec.ts`, not here.
 */

type StoryEntry = { id: string; type: string; name: string; title: string };
type Baseline = Record<string, string[]>;

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const baselineUrl = new URL("../../axe-baseline.json", import.meta.url);
const updateBaseline = process.env.UPDATE_A11Y_BASELINE === "1";

function loadBaseline(): Baseline {
  try {
    return JSON.parse(readFileSync(baselineUrl, "utf8")) as Baseline;
  } catch {
    return {};
  }
}

test("Storybook stories have no new WCAG 2.1 A/AA axe violations", async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(900_000);

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

  const baseline = loadBaseline();
  const observed: Baseline = {};
  const regressions: string[] = [];
  const crashed: string[] = [];

  for (const story of stories) {
    // Fresh context+page per story: keeps memory flat, isolates a crashing
    // story, and gives @axe-core/playwright the dedicated context it requires.
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
      await page
        .waitForSelector("#storybook-root *", { timeout: 10_000 })
        .catch(() => undefined);

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      const ruleIds = [...new Set(results.violations.map((v) => v.id))].sort();
      if (ruleIds.length > 0) {
        observed[story.id] = ruleIds;
      }

      if (!updateBaseline) {
        const allowed = new Set(baseline[story.id] ?? []);
        for (const violation of results.violations) {
          if (!allowed.has(violation.id)) {
            regressions.push(
              `${story.id} → ${violation.id}: ${violation.help} ` +
                `(${violation.nodes.length} node[s]; ${violation.helpUrl})`,
            );
          }
        }
      }
    } catch (error) {
      crashed.push(`${story.id}: ${(error as Error).message}`);
    } finally {
      await context.close();
    }
  }

  // A crash means axe never ran, so an empty/partial result is NOT a pass —
  // fail even when (re)generating the baseline so a green baseline is trustworthy.
  expect(
    crashed,
    `Stories that crashed during the axe sweep (axe did not run — investigate):\n${crashed.join(
      "\n",
    )}`,
  ).toEqual([]);

  if (updateBaseline) {
    const sorted: Baseline = {};
    for (const id of Object.keys(observed).sort()) {
      sorted[id] = observed[id];
    }
    writeFileSync(baselineUrl, `${JSON.stringify(sorted, null, 2)}\n`);
    test.info().annotations.push({
      type: "a11y-baseline",
      description: `Wrote baseline for ${Object.keys(sorted).length} stories`,
    });
    return;
  }

  expect(
    regressions,
    `New WCAG 2.1 violations not present in axe-baseline.json:\n${regressions.join(
      "\n",
    )}\n\nFix them, or (if intentional) re-baseline with ` +
      `UPDATE_A11Y_BASELINE=1 npm run test:browser -- a11y.spec.ts`,
  ).toEqual([]);
});
