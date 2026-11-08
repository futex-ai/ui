/**
 * Browser coverage for the notice: what assistive technology hears, and the
 * layout of the box. The announcer writes to a live region, which only a real
 * host renders, and the wrap of the actions is layout.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

/** The shared announcer's assertive region. */
const ASSERTIVE_REGION = "#firna-ui-live-region-assertive";

async function gotoNoticeStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=notice-examples--${storyId}&viewMode=story`);
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

/** Records each text that the assertive region receives, in order. */
async function recordAnnouncements(page: Page) {
  await page.evaluate((selector) => {
    const record: string[] = [];
    (window as unknown as { announcements: string[] }).announcements = record;
    const watch = (region: Element) =>
      new MutationObserver(() => {
        if (region.textContent) {
          record.push(region.textContent);
        }
      }).observe(region, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    const existing = document.querySelector(selector);
    if (existing) {
      watch(existing);
      return;
    }
    new MutationObserver((_, observer) => {
      const region = document.querySelector(selector);
      if (region) {
        observer.disconnect();
        watch(region);
      }
    }).observe(document.body, { childList: true });
  }, ASSERTIVE_REGION);
  return () =>
    page.evaluate(
      () => (window as unknown as { announcements: string[] }).announcements,
    );
}

const deployFailed = (step: string) =>
  `The deploy failed. The build stopped at ${step}. The live site still runs the last good deploy.`;

test("an urgent notice announces when it appears and when its message changes, and keeps focus", async ({
  page,
}) => {
  await gotoNoticeStory(page, "announcement");
  const announcements = await recordAnnouncements(page);
  const button = (name: string) => page.getByRole("button", { name });

  // A neutral notice is ordinary content: no alert, and no announcement.
  await button("Start a deploy").click();
  await expect(page.getByText("Deploying to production")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // The urgent notice is an alert, and announces its title and text body.
  // The announcer's own region is an alert too, so find the notice by its
  // action.
  await button("Fail the deploy").click();
  await expect(
    page.getByRole("alert").filter({ has: button("Try again") }),
  ).toContainText("The deploy failed");
  await expect.poll(announcements).toEqual([deployFailed("the test step")]);

  // A re-render with the same message stays silent; a new message announces.
  await button("Refresh").click();
  await expect(page.getByText("Refreshes: 1")).toBeVisible();
  await button("Change the failed step").click();
  await expect
    .poll(announcements)
    .toEqual([deployFailed("the test step"), deployFailed("the build step")]);

  // A node body is announced through the caller's text, also when it changes.
  await button("Fail the checks").click();
  await button("Refresh").click();
  await expect(page.getByText("Refreshes: 2")).toBeVisible();
  await button("Change the failed check").click();
  await expect
    .poll(announcements)
    .toEqual([
      deployFailed("the test step"),
      deployFailed("the build step"),
      "Checks failed. Unit tests did not pass.",
      "Checks failed. Type check did not pass.",
    ]);

  // No notice took focus from the control that changed it.
  await expect(button("Change the failed check")).toBeFocused();
});

/** The fill of a box and the colour and width of each of its four edges. */
async function boxEdges(box: Locator) {
  return box.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      colors: [
        style.borderTopColor,
        style.borderRightColor,
        style.borderBottomColor,
        style.borderLeftColor,
      ],
      fill: style.backgroundColor,
      widths: [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ],
    };
  });
}

test("a notice shows its tone as a fill and a full outline, and a narrow notice puts its actions below its text", async ({
  page,
}) => {
  await gotoNoticeStory(page, "tones");
  // The default theme: roseSoft with rose at 35%, and bg with border2. No
  // edge is an accent strip: all four edges match.
  expect(await boxEdges(page.getByTestId("failed-notice"))).toEqual({
    colors: Array(4).fill("rgba(168, 79, 69, 0.35)"),
    fill: "rgb(244, 227, 223)",
    widths: Array(4).fill("1px"),
  });
  expect(await boxEdges(page.getByTestId("deploying-notice"))).toEqual({
    colors: Array(4).fill("rgb(211, 216, 205)"),
    fill: "rgb(247, 247, 243)",
    widths: Array(4).fill("1px"),
  });

  // In a wide notice the actions follow the text.
  const body = page.getByText(/^The build stopped at the test step/);
  const retry = page.getByRole("button", { name: "Try again" });
  const wideBody = await body.boundingBox();
  const wideRetry = await retry.boundingBox();
  expect(wideRetry?.x ?? 0).toBeGreaterThan(
    (wideBody?.x ?? 0) + (wideBody?.width ?? 0),
  );
  expect(wideRetry?.y ?? 0).toBeLessThan(
    (wideBody?.y ?? 0) + (wideBody?.height ?? 0),
  );

  // In a narrow notice they go below it, and start at the same edge.
  await gotoNoticeStory(page, "narrow");
  const narrowBody = await body.boundingBox();
  const narrowLog = await page
    .getByTestId("failed-notice")
    .getByRole("link", { name: "View log" })
    .boundingBox();
  expect(narrowLog?.y ?? 0).toBeGreaterThanOrEqual(
    (narrowBody?.y ?? 0) + (narrowBody?.height ?? 0),
  );
  expect(narrowLog?.x).toBeCloseTo(narrowBody?.x ?? -1, 0);
});
