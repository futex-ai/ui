import { expect, test } from "@playwright/test";

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
 * The drag-select gesture on the "Page shell" story: one provider is the
 * scrolling main column, beside a sidebar outside it, with 30 rows that each
 * hold a library `Button`. The 4.x provider failed each of these in Chrome.
 */

test.describe("drag-select page shell", () => {
  test.beforeEach(async ({ page }) => {
    await openStory(page, "page-shell");
  });

  test("a click on a row button, then a drag from the gutter, selects rows", async ({
    page,
  }) => {
    await page.getByTestId("shell-open-txn_1").click();
    await expect(page.getByText("Opened: txn_1")).toBeVisible();

    const content = await boxOf(page, "page-shell-content");
    const from = await pointIn(page, "shell-row-txn_2", 0);
    const to = await pointIn(page, "shell-row-txn_4", 120);
    await dragBetween(page, { x: content.x - 40, y: from.y }, to);

    await expect(page.getByText("Selected 3 rows")).toBeVisible();
    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 2, 4));
  });

  test("a click on a row, then a drag from another row, selects rows", async ({
    page,
  }) => {
    const first = await pointIn(page, "shell-row-txn_1", 160);
    await page.mouse.click(first.x, first.y);

    const from = await pointIn(page, "shell-row-txn_3", 160);
    const to = await pointIn(page, "shell-row-txn_5", 200);
    await dragBetween(page, from, to);

    await expect(page.getByText("Selected 3 rows")).toBeVisible();
    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 3, 5));
  });

  test("a drag that starts on highlighted text selects rows", async ({
    page,
  }) => {
    const word = await boxOfLocator(
      page
        .getByTestId("shell-row-txn_5")
        .getByText("Trainline", { exact: true }),
    );
    const from = { x: word.x + 10, y: word.y + word.height / 2 };
    await page.mouse.dblclick(from.x, from.y);
    expect(await highlightedText(page)).toBe("Trainline");

    const to = await pointIn(page, "shell-row-txn_7", 200);
    await dragBetween(page, from, to);

    await expect(page.getByText("Selected 3 rows")).toBeVisible();
    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 5, 7));
  });

  test("a scroll during a drag keeps the start row", async ({ page }) => {
    const from = await pointIn(page, "shell-row-txn_1", 160);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y + 20, { steps: 4 });
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() =>
        page.getByTestId("page-shell-main").evaluate((main) => main.scrollTop),
      )
      .toBeGreaterThan(300);
    await page.mouse.move(from.x + 20, from.y + 40, { steps: 4 });
    const lastRow = await page.evaluate(
      ({ x, y }) =>
        document
          .elementFromPoint(x, y)
          ?.closest('[data-testid^="shell-row-"]')
          ?.getAttribute("data-testid")
          ?.replace("shell-row-txn_", "") ?? "0",
      { x: from.x + 20, y: from.y + 40 },
    );
    await page.mouse.up();

    const last = Number(lastRow);
    expect(last).toBeGreaterThan(8);
    expect(await checkedRowIds(page)).toEqual(rowRange("txn", 1, last));
  });

  test("holding the pointer at the bottom edge scrolls and extends the drag", async ({
    page,
  }) => {
    const main = page.getByTestId("page-shell-main");
    const column = await boxOf(page, "page-shell-main");
    const from = await pointIn(page, "shell-row-txn_1", 160);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, column.y + column.height - 10, {
      steps: 8,
    });
    await expect
      .poll(() => main.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(400);
    await expect
      .poll(async () =>
        Number(
          /Matching (\d+)/.exec(
            (await page.getByTestId("page-shell-status").textContent()) ?? "",
          )?.[1] ?? 0,
        ),
      )
      .toBeGreaterThan(15);
    await page.mouse.up();

    const checked = await checkedRowIds(page);
    expect(checked.length).toBeGreaterThan(15);
    expect(checked).toEqual(rowRange("txn", 1, checked.length));
  });

  test("auto-scroll leaves an axis with hidden overflow alone", async ({
    page,
  }) => {
    const main = page.getByTestId("page-shell-main");
    const overflow = await main.evaluate((element) => {
      const spacer = document.createElement("div");
      spacer.style.cssText = "flex-shrink:0;height:1px;width:3000px";
      element.appendChild(spacer);
      return {
        hidden: getComputedStyle(element).overflowX,
        wider: element.scrollWidth > element.clientWidth,
      };
    });
    expect(overflow).toEqual({ hidden: "hidden", wider: true });

    const column = await boxOf(page, "page-shell-main");
    const from = await pointIn(page, "shell-row-txn_1", 160);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(
      column.x + column.width - 10,
      column.y + column.height - 10,
      { steps: 8 },
    );
    await expect
      .poll(() => main.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(200);
    expect(await main.evaluate((element) => element.scrollLeft)).toBe(0);
    await page.mouse.up();
  });

  test("a drag that ends on its starting row sends the row no click", async ({
    page,
  }) => {
    await page.getByTestId("shell-row-txn_3").evaluate((row) => {
      const counter = window as unknown as { rowClicks: number };
      counter.rowClicks = 0;
      row.addEventListener("click", () => {
        counter.rowClicks += 1;
      });
    });
    const clicks = () =>
      page.evaluate(
        () => (window as unknown as { rowClicks: number }).rowClicks,
      );

    const from = await pointIn(page, "shell-row-txn_3", 160);
    await dragBetween(page, from, { x: from.x + 80, y: from.y + 2 });
    await expect(page.getByText("Selected 1 row")).toBeVisible();
    expect(await clicks()).toBe(0);

    await page.mouse.click(from.x, from.y);
    expect(await clicks()).toBe(1);
  });

  test("drag-select selection callback is stable across callback identities", async ({
    page,
  }) => {
    const from = await pointIn(page, "shell-row-txn_1", 160);
    const to = await pointIn(page, "shell-row-txn_3", 200);
    await dragBetween(page, from, to);
    const reported = page.getByText(
      "Selection changes: 1. Last: txn_1, txn_2, txn_3",
    );
    await expect(reported).toBeVisible();

    await page.getByTestId("shell-open-txn_5").click();
    await expect(page.getByText("Opened: txn_5")).toBeVisible();
    await expect(reported).toBeVisible();
  });

  test("Escape cancels a started drag without a change", async ({ page }) => {
    const from = await pointIn(page, "shell-row-txn_1", 160);
    const to = await pointIn(page, "shell-row-txn_3", 200);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await expect(page.getByText("Matching 3 rows")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("Matching 3 rows")).toBeHidden();
    expect(await marqueeCount(page)).toBe(0);
    await page.mouse.up();

    await expect(page.getByText("Selected 0 rows")).toBeVisible();
    await expect(
      page.getByText("Selection changes: 0. Last: none"),
    ).toBeVisible();
  });
});

test("a page without targets draws no box", async ({ page }) => {
  await openStory(page, "empty-page");
  const box = await boxOf(page, "empty-page-main");
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 160, { steps: 8 });

  await expect(page.getByText("No drag in progress")).toBeVisible();
  expect(await marqueeCount(page)).toBe(0);
  await expect(page.getByText(/\d+ items?$/)).toHaveCount(0);
  await page.mouse.up();
});

test("the innermost provider owns a press", async ({ page }) => {
  await openStory(page, "nested-providers");
  const inner = await boxOf(page, "nested-inner");
  const row = await pointIn(page, "nested-row-pay_1", 40);
  const from = { x: inner.x + 5, y: row.y };
  const to = await pointIn(page, "nested-row-pay_2", 200);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });

  await expect(page.getByTestId("nested-inner-status")).toContainText(
    "dragging",
  );
  await expect(page.getByTestId("nested-outer-status")).toContainText("idle");
  await page.mouse.up();

  await expect(page.getByTestId("nested-inner-status")).toHaveText(
    "Recent payments: idle, selected pay_1, pay_2",
  );
  await expect(page.getByTestId("nested-outer-status")).toHaveText(
    "Accounts: idle, selected none",
  );
});
