import { expect, test } from "@playwright/test";

import {
  boxOf,
  checkedRowIds,
  dragBetween,
  openStory,
  pointIn,
  rowRange,
} from "./dragSelectHelpers";

/**
 * Scrollbar presses with real scrollbars. Headless Chromium hides scrollbars
 * by default, which turns every scroll container into an overlay-scrollbar
 * container, so this file launches Chrome with classic scrollbars.
 */
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("a scrollbar drag keeps the selection", async ({ page }) => {
  await openStory(page, "page-shell");
  const from = await pointIn(page, "shell-row-txn_1", 160);
  const to = await pointIn(page, "shell-row-txn_3", 200);
  await dragBetween(page, from, to);
  await expect(page.getByText("Selected 3 rows")).toBeVisible();

  const main = page.getByTestId("page-shell-main");
  const gutter = await main.evaluate(
    (element) => (element as HTMLElement).offsetWidth - element.clientWidth,
  );
  expect(gutter).toBeGreaterThan(0);
  const box = await boxOf(page, "page-shell-main");
  const thumb = { x: box.x + box.width - gutter / 2, y: box.y + 40 };
  await dragBetween(page, thumb, { x: thumb.x, y: thumb.y + 120 });

  await expect
    .poll(() => main.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(page.getByText("Selected 3 rows")).toBeVisible();
  expect(await checkedRowIds(page)).toEqual(rowRange("txn", 1, 3));
});
