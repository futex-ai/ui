import { expect, test, type Page } from "@playwright/test";

import {
  checkedRowIds,
  matchingRowCount,
  openStory,
  pointIn,
  rowRange,
  shellRowNumberAt,
} from "./dragSelectHelpers";

/**
 * Drags on the "Page shell" story when `<body>` scrolls the page, and when
 * the viewport takes the overflow of `<body>`. A user cannot change the root
 * styles of a story's page, so each test arranges the layout with a style
 * tag: the provider column stops scrolling, and its rows overflow the page.
 */

/** The root element hides its overflow, so `<body>` scrolls the page. */
const BODY_SCROLLER = `
  html { overflow: hidden; }
  body { height: 100vh; margin: 0; overflow: auto; }
  [data-testid="page-shell-main"] { overflow: visible !important; }
`;

/**
 * The root element's overflow is `visible`, so the viewport takes the
 * overflow of `<body>`, and the window scrolls the page.
 */
const VIEWPORT_TAKES_BODY_OVERFLOW = `
  html, body { height: 100%; }
  body { margin: 0; overflow: auto; }
  [data-testid="page-shell-main"] { overflow: visible !important; }
`;

/** Opens the page shell with `css` on the page; returns what scrolls. */
async function openPageShellWith(page: Page, css: string) {
  await openStory(page, "page-shell");
  await page.addStyleTag({ content: css });
  return page.evaluate(() => ({
    body: getComputedStyle(document.body).overflowY,
    bodyOverflows: document.body.scrollHeight > document.body.clientHeight,
    root: getComputedStyle(document.documentElement).overflowY,
  }));
}

const bodyScrollTop = (page: Page) =>
  page.evaluate(() => document.body.scrollTop);

/** Holds a drag from row 1 at the bottom edge of the viewport. */
async function holdDragAtBottomEdge(page: Page) {
  const from = await pointIn(page, "shell-row-txn_1", 160);
  const bottom = await page.evaluate(
    () => document.documentElement.clientHeight,
  );
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, bottom - 10, { steps: 8 });
}

/** Releases a held drag that auto-scroll extended past row 15. */
async function releaseExtendedDrag(page: Page) {
  await expect.poll(() => matchingRowCount(page)).toBeGreaterThan(15);
  await page.mouse.up();

  const checked = await checkedRowIds(page);
  expect(checked.length).toBeGreaterThan(15);
  expect(checked).toEqual(rowRange("txn", 1, checked.length));
}

test.describe("drag-select when <body> scrolls the page", () => {
  test.beforeEach(async ({ page }) => {
    expect(await openPageShellWith(page, BODY_SCROLLER)).toEqual({
      body: "auto",
      bodyOverflows: true,
      root: "hidden",
    });
  });

  test("a wheel scroll during a drag keeps the start row", async ({ page }) => {
    const from = await pointIn(page, "shell-row-txn_1", 160);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y + 20, { steps: 4 });
    await page.mouse.wheel(0, 400);
    await expect.poll(() => bodyScrollTop(page)).toBeGreaterThan(300);
    const to = { x: from.x + 20, y: from.y + 40 };
    await page.mouse.move(to.x, to.y, { steps: 4 });
    const last = await shellRowNumberAt(page, to);
    await page.mouse.up();

    expect(last).toBeGreaterThan(8);
    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 1, last));
  });

  test("holding the pointer at the bottom edge scrolls the body and extends the drag", async ({
    page,
  }) => {
    await holdDragAtBottomEdge(page);
    await expect.poll(() => bodyScrollTop(page)).toBeGreaterThan(400);
    await releaseExtendedDrag(page);
  });
});

test("when the viewport takes the overflow of <body>, the bottom edge scrolls the window and extends the drag", async ({
  page,
}) => {
  expect(await openPageShellWith(page, VIEWPORT_TAKES_BODY_OVERFLOW)).toEqual({
    body: "auto",
    bodyOverflows: true,
    root: "visible",
  });

  await holdDragAtBottomEdge(page);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(400);
  await releaseExtendedDrag(page);
});
