import { expect, test, type Page } from "@playwright/test";

import {
  boxOf,
  boxOfLocator,
  checkedRowIds,
  dragBetween,
  highlightedText,
  marqueeCount,
  openStory,
  pointIn,
  rowRange,
} from "./dragSelectHelpers";

/**
 * The drag-select options on the "Page shell" story: modifier keys, drags
 * from row buttons, and the text-selection block. The shell keeps its
 * provider off, and each page turns it on with `useDragSelectableOptions`.
 */

async function dragRows(page: Page, from: number, to: number) {
  await dragBetween(
    page,
    await pointIn(page, `shell-row-txn_${from}`, 160),
    await pointIn(page, `shell-row-txn_${to}`, 200),
  );
}

async function background(page: Page, testId: string) {
  return page
    .getByTestId(testId)
    .evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.beforeEach(async ({ page }) => {
  await openStory(page, "page-shell");
});

test("a drag from a row button ends its press and fires no onPress", async ({
  page,
}) => {
  const resting = await background(page, "shell-open-txn_2");
  const from = await pointIn(page, "shell-open-txn_2", 12);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await expect
    .poll(() => background(page, "shell-open-txn_2"))
    .not.toBe(resting);

  const to = await pointIn(page, "shell-row-txn_4", 200);
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await expect(page.getByText("Matching 3 rows")).toBeVisible();
  await expect.poll(() => background(page, "shell-open-txn_2")).toBe(resting);
  await page.mouse.up();

  await expect(page.getByText("Selected 3 rows")).toBeVisible();
  await expect(page.getByText("Opened: none")).toBeVisible();
  expect(await checkedRowIds(page)).toEqual(rowRange("txn", 2, 4));
});

test("a short move on a row button still presses it", async ({ page }) => {
  const from = await pointIn(page, "shell-open-txn_6", 12);
  await dragBetween(page, from, { x: from.x + 6, y: from.y + 2 }, 3);
  await expect(page.getByText("Opened: txn_6")).toBeVisible();
  await expect(page.getByText("Selected 0 rows")).toBeVisible();

  await page.getByTestId("shell-open-txn_7").click();
  await expect(page.getByText("Opened: txn_7")).toBeVisible();
});

for (const key of ["Control", "Alt"] as const) {
  test(`a ${key}-drag does not start`, async ({ page }) => {
    await dragRows(page, 1, 3);
    await expect(page.getByText("Selected 3 rows")).toBeVisible();

    await page.keyboard.down(key);
    const from = await pointIn(page, "shell-row-txn_5", 160);
    const to = await pointIn(page, "shell-row-txn_7", 200);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    expect(await marqueeCount(page)).toBe(0);
    await page.mouse.up();
    await page.keyboard.up(key);

    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 1, 3));
  });
}

test("a Shift-drag adds rows and a Meta-drag toggles them", async ({
  page,
}) => {
  await dragRows(page, 1, 2);
  await page.keyboard.down("Shift");
  await dragRows(page, 5, 6);
  await page.keyboard.up("Shift");
  expect(await checkedRowIds(page)).toEqual([
    "txn_1",
    "txn_2",
    "txn_5",
    "txn_6",
  ]);

  await page.keyboard.down("Meta");
  await dragRows(page, 2, 5);
  await page.keyboard.up("Meta");
  expect(await checkedRowIds(page)).toEqual([
    "txn_1",
    "txn_3",
    "txn_4",
    "txn_6",
  ]);
});

test("a drag highlights no text, even when it ends over the sidebar", async ({
  page,
}) => {
  const content = await boxOf(page, "page-shell-content");
  const from = await pointIn(page, "shell-row-txn_2", 0);
  await page.mouse.move(content.x - 40, from.y);
  await page.mouse.down();
  await page.mouse.move(content.x + 300, from.y + 120, { steps: 10 });
  expect(await highlightedText(page)).toBe("");
  await page.mouse.up();
  expect(await highlightedText(page)).toBe("");

  const sidebar = await boxOf(page, "page-shell-sidebar");
  const text = await pointIn(page, "shell-row-txn_5", 60);
  await page.mouse.move(text.x, text.y);
  await page.mouse.down();
  await page.mouse.move(sidebar.x + 40, sidebar.y + 30, { steps: 12 });
  expect(await highlightedText(page)).toBe("");
  await page.mouse.up();
  expect(await highlightedText(page)).toBe("");
});

test("a double-click selects a word and a triple-click selects a paragraph", async ({
  page,
}) => {
  const word = await boxOfLocator(
    page.getByTestId("shell-row-txn_4").getByText("AWS EU-WEST"),
  );
  await page.mouse.dblclick(word.x + 8, word.y + word.height / 2);
  expect(await highlightedText(page)).toBe("AWS");

  const paragraph = await boxOfLocator(page.getByText(/^Bank transactions/));
  await page.mouse.click(paragraph.x + 20, paragraph.y + 8, { clickCount: 3 });
  expect(await highlightedText(page)).toMatch(
    /^Bank transactions for this month/,
  );
});

test("the highlight switch restores text selection during a drag", async ({
  page,
}) => {
  await page.getByTestId("page-shell-keep-text").click();
  const from = await pointIn(page, "shell-row-txn_2", 60);
  const to = await pointIn(page, "shell-row-txn_4", 200);
  await dragBetween(page, from, to);
  await expect(page.getByText("Selected 3 rows")).toBeVisible();
  expect(await highlightedText(page)).not.toBe("");
});

test("the start removes a highlight that formed before it", async ({
  page,
}) => {
  await openStory(page, "larger-minimum-drag");
  const title = await boxOfLocator(
    page.getByTestId("drag-target-txn_1").getByText("Stripe payout"),
  );
  const from = { x: title.x + 2, y: title.y + title.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y, { steps: 4 });
  await expect.poll(() => highlightedText(page)).not.toBe("");

  await page.mouse.move(from.x + 30, from.y + 80, { steps: 4 });
  await expect(page.getByText("Matching 2 transactions")).toBeVisible();
  expect(await highlightedText(page)).toBe("");
  await page.mouse.up();
});

test("a drag inside a data grid or a sortable list draws no box", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Invoices" }).click();
  const status = page.getByTestId("page-shell-status");
  for (const surface of ["page-shell-grid", "page-shell-templates"]) {
    const box = await boxOf(page, surface);
    await page.getByTestId(surface).scrollIntoViewIfNeeded();
    const area = await boxOf(page, surface);
    await page.mouse.move(area.x + 60, area.y + 60);
    await page.mouse.down();
    await page.mouse.move(area.x + 160, area.y + Math.min(box.height, 120), {
      steps: 8,
    });
    expect(await marqueeCount(page)).toBe(0);
    await expect(status).not.toContainText("Matching");
    await page.mouse.up();
  }
  await expect(page.getByText("Selected 0 rows")).toBeVisible();
});
