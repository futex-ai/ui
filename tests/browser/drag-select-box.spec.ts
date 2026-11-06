import { expect, test, type Page } from "@playwright/test";

import { boxOf, boxOfLocator, openStory, pointIn } from "./dragSelectHelpers";

/** The drawn box and the provider element's role. */

const MARQUEE = "[data-drag-select-marquee]";

/** Holds a drag over the first three ledger rows. */
async function holdLedgerDrag(page: Page) {
  const from = await pointIn(page, "drag-target-txn_1", 8);
  const to = await pointIn(page, "drag-target-txn_3", 300);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await expect(page.locator(MARQUEE)).toBeVisible();
}

test("a straight drag draws its box as a line", async ({ page }) => {
  await openStory(page, "page-shell");
  const from = await pointIn(page, "shell-row-txn_1", 160);
  const to = await pointIn(page, "shell-row-txn_3", 160);
  expect(to.x).toBe(from.x);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await expect(page.locator(MARQUEE)).toBeVisible();
  await expect(page.locator(MARQUEE)).toHaveText("3 rows");
  await page.mouse.up();
  await expect(page.getByText("Selected 3 rows")).toBeVisible();
});

test("the default box shows the badge and no label", async ({ page }) => {
  await openStory(page, "ledger-rows");
  await holdLedgerDrag(page);
  await expect(page.locator(MARQUEE)).toHaveText("3 transactions");
  await page.mouse.up();
  await expect(page.locator(MARQUEE)).toHaveCount(0);
});

test("marqueeLabel adds a label and a null selectionLabel hides the badge", async ({
  page,
}) => {
  await openStory(page, "custom-marquee");
  await page.getByRole("radio", { name: "Labelled box" }).click();
  await holdLedgerDrag(page);
  await expect(page.locator(MARQUEE)).toHaveText("Select3 transactions");
  await page.mouse.up();

  await page.getByRole("radio", { name: "No badge" }).click();
  await holdLedgerDrag(page);
  await expect(page.locator(MARQUEE)).toHaveText("");
  await page.mouse.up();
});

test("renderMarquee draws the app's box inside the layer", async ({ page }) => {
  await openStory(page, "custom-marquee");
  await holdLedgerDrag(page);
  const custom = page.getByTestId("custom-marquee");
  await expect(custom).toHaveText("3 transactions · replace");
  const layer = await boxOfLocator(page.locator(MARQUEE));
  const drawn = await boxOfLocator(custom);
  expect(drawn.width).toBeCloseTo(layer.width, 0);
  expect(drawn.height).toBeCloseTo(layer.height, 0);
  await page.mouse.up();
});

test("the drawn box stays inside the visible column", async ({ page }) => {
  await openStory(page, "page-shell");
  const column = await boxOf(page, "page-shell-main");
  const from = await pointIn(page, "shell-row-txn_1", 160);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + 40, { steps: 4 });
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() =>
      page.getByTestId("page-shell-main").evaluate((main) => main.scrollTop),
    )
    .toBeGreaterThan(400);
  await page.mouse.move(from.x + 40, from.y + 60, { steps: 4 });
  const layer = await boxOfLocator(page.locator(MARQUEE));
  expect(layer.y).toBeGreaterThanOrEqual(column.y - 0.5);
  expect(layer.y + layer.height).toBeLessThanOrEqual(
    column.y + column.height + 0.5,
  );
  await page.mouse.up();
});

test("an unnamed provider has no role and a named one is a group", async ({
  page,
}) => {
  await openStory(page, "page-shell");
  await expect(page.getByTestId("page-shell-main")).not.toHaveAttribute(
    "role",
    /.*/,
  );

  await openStory(page, "ledger-rows");
  await expect(page.getByRole("group", { name: "Transactions" })).toBeVisible();
});
