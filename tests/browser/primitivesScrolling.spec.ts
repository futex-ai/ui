import { expect, test, type Page } from "@playwright/test";

/**
 * `ScrollView` and `FlatList`, driven directly.
 *
 * `Primitives/Scrolling` renders each with a readout, so the behaviours the DOM
 * backend has to reproduce from `react-native-web` — the scroll event's
 * `contentOffset` / `contentSize` payload, the imperative `scrollTo`, and
 * `VirtualizedList`'s windowing — fail here with a pointed message rather than
 * as a pixel diff inside some component.
 */

/** The element a `ScrollView` actually scrolls, as `getScrollableNode` returns it. */
function scroller(page: Page, testId: string) {
  return page.getByTestId(testId);
}

test("a scroll view reports where it is and how big its content is", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-scrolling--scroll");
  const offset = page.getByTestId("scroll-offset");
  const size = page.getByTestId("scroll-content-size");

  await expect(offset).toHaveText("offset 0");
  // `onContentSizeChange` reports the inner content wrapper's box: twelve 40 px
  // bands, eleven 8 px gaps and 8 px of padding top and bottom.
  await expect(size).toHaveText("384x584");

  await scroller(page, "scroller").evaluate((node) => {
    node.scrollTop = 120;
  });
  await expect(offset).toHaveText("offset 120");
});

test("scrollTo and scrollToEnd drive the scroller from a ref", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-scrolling--scroll");
  const offset = page.getByTestId("scroll-offset");

  await page.getByTestId("scroll-to-200").click();
  await expect(offset).toHaveText("offset 200");

  await page.getByTestId("scroll-to-end").click();
  // 584 px of content in a 118 px content box leaves 466 px of travel.
  await expect(offset).toHaveText("offset 466");
});

test("the trailing scroll event reports the resting position", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-scrolling--scroll");
  const node = scroller(page, "scroller");
  // Two scrolls inside the throttle window: the second is only reported by the
  // 100 ms settle timer, which is what `DateWheel` relies on.
  await node.evaluate((element) => {
    element.scrollTop = 40;
    element.scrollTop = 41;
  });
  await expect(page.getByTestId("scroll-offset")).toHaveText("offset 41");
});

test("a windowed list renders a slice, not the whole list", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-scrolling--windowed");
  const count = page.getByTestId("rendered-count");
  const rows = page.getByTestId("windowed-list").getByText(/^Row \d+$/);

  // The window settles on the overscan region, one batch at a time: an 84 px
  // viewport and `windowSize` 21 reach 924 px of content, which is 33 of the
  // 28 px rows — far more than the ten the first batch renders, far fewer than
  // the two hundred in the data.
  await expect(count).toHaveText("33 of 200 rendered");
  await expect(rows).toHaveCount(33);

  // The first row is mounted and the last is not.
  await expect(page.getByText("Row 0", { exact: true })).toBeVisible();
  await expect(page.getByText("Row 199", { exact: true })).toHaveCount(0);
});

test("scrolling a windowed list moves the window with it", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-scrolling--windowed");
  await expect(page.getByTestId("rendered-count")).toHaveText(
    "33 of 200 rendered",
  );

  // 200 rows of 28 px: row 150 starts at 4200.
  await page.getByTestId("windowed-list").evaluate((node) => {
    node.scrollTop = 4200;
  });
  await expect(page.getByText("Row 150", { exact: true })).toBeVisible({
    timeout: 5_000,
  });
  // Row 0 has been recycled out of the window rather than kept forever.
  await expect(page.getByText("Row 0", { exact: true })).toHaveCount(0);
});

test("the list's scroll node is the first overflowing element inside it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-scrolling--windowed");
  await expect(page.getByTestId("rendered-count")).toHaveText(
    "33 of 200 rendered",
  );
  // `useDataGridDrag` finds the scroller this way, so the element carrying the
  // `testID` has to be the one that actually overflows.
  const overflows = await page
    .getByTestId("windowed-list")
    .evaluate((node) => node.scrollHeight > node.clientHeight + 1);
  expect(overflows).toBe(true);
});
