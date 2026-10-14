import { expect, test, type Page } from "@playwright/test";

import {
  checkedRowIds,
  dragBetween,
  openStory,
  pointIn,
  rowRange,
} from "./dragSelectHelpers";

/**
 * Controlled and uncontrolled selection: the "Controlled selection" story,
 * where the app owns the selection, and the page change on the "Page shell"
 * story.
 */

const REGION = "#firna-ui-live-region-polite";

async function dragRows(page: Page, from: number, to: number) {
  await dragBetween(
    page,
    await pointIn(page, `controlled-row-txn_${from}`, 60),
    await pointIn(page, `controlled-row-txn_${to}`, 200),
  );
}

async function controlledCheckedIds(page: Page) {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll('[data-testid^="controlled-row-"]'),
      (row) =>
        row.getAttribute("aria-checked") === "true"
          ? (row.getAttribute("data-testid") ?? "").replace(
              "controlled-row-",
              "",
            )
          : null,
    ).filter((id): id is string => id !== null),
  );
}

/** Records every non-empty text that the polite live region shows. */
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
  }, REGION);
  return () =>
    page.evaluate(
      () => (window as unknown as { announcements: string[] }).announcements,
    );
}

test.describe("controlled selection", () => {
  test.beforeEach(async ({ page }) => {
    await openStory(page, "controlled-selection");
  });

  test("the app applies a drag proposal, rejects one, and clears", async ({
    page,
  }) => {
    const announcements = await recordAnnouncements(page);
    await dragRows(page, 1, 3);
    await expect(page.getByTestId("controlled-count")).toHaveText("3 selected");
    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 1. Last: txn_1, txn_2, txn_3 (drag, replace)",
    );
    expect(await controlledCheckedIds(page)).toEqual(rowRange("txn", 1, 3));
    await expect(page.locator(REGION)).toHaveText("3 transactions selected");

    await page.getByTestId("controlled-lock").click();
    await dragRows(page, 5, 6);
    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 2. Last: txn_5, txn_6 (drag, replace)",
    );
    await expect(page.getByTestId("controlled-count")).toHaveText("3 selected");
    expect(await controlledCheckedIds(page)).toEqual(rowRange("txn", 1, 3));

    await page.getByTestId("controlled-clear").click();
    await expect(page.getByTestId("controlled-count")).toHaveText("0 selected");
    expect(await controlledCheckedIds(page)).toEqual([]);

    await page.getByTestId("controlled-lock").click();
    await dragRows(page, 7, 8);
    await expect(page.locator(REGION)).toHaveText("2 transactions selected");
    expect(await announcements()).toEqual([
      "3 transactions selected",
      "2 transactions selected",
    ]);
  });

  test("clicks, Command-clicks, and Shift-clicks reach the app", async ({
    page,
  }) => {
    await page.getByTestId("controlled-row-txn_2").click();
    expect(await controlledCheckedIds(page)).toEqual(["txn_2"]);
    await page
      .getByTestId("controlled-row-txn_4")
      .click({ modifiers: ["Meta"] });
    expect(await controlledCheckedIds(page)).toEqual(["txn_2", "txn_4"]);
    await page
      .getByTestId("controlled-row-txn_6")
      .click({ modifiers: ["Shift"] });
    expect(await controlledCheckedIds(page)).toEqual(rowRange("txn", 4, 6));
    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 0. Last: none",
    );
  });

  test("a Command-drag inside one row toggles it and sends no click", async ({
    page,
  }) => {
    await dragRows(page, 1, 3);
    const from = await pointIn(page, "controlled-row-txn_5", 60);
    await page.keyboard.down("Meta");
    await dragBetween(page, from, { x: from.x + 80, y: from.y + 2 });
    await page.keyboard.up("Meta");

    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 2. Last: txn_1, txn_2, txn_3, txn_5 (drag, toggle)",
    );
    expect(await controlledCheckedIds(page)).toEqual([
      "txn_1",
      "txn_2",
      "txn_3",
      "txn_5",
    ]);
  });

  test("keyboard toggles and ranges arrive as proposals", async ({ page }) => {
    await page.getByTestId("controlled-row-txn_2").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 1. Last: txn_2 (keyboard, toggle)",
    );
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.getByTestId("controlled-log")).toHaveText(
      "Proposals: 2. Last: txn_2, txn_3 (keyboard, replace)",
    );
    expect(await controlledCheckedIds(page)).toEqual(["txn_2", "txn_3"]);
  });
});

test("a page change clears the uncontrolled selection", async ({ page }) => {
  await openStory(page, "page-shell");
  await dragBetween(
    page,
    await pointIn(page, "shell-row-txn_1", 160),
    await pointIn(page, "shell-row-txn_3", 200),
  );
  await expect(page.getByText("Selected 3 rows")).toBeVisible();

  await page.getByRole("button", { name: "Invoices" }).click();
  await expect(page.getByText("Selected 0 rows")).toBeVisible();
  await expect(
    page.getByText("Selection changes: 2. Last: none"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Transactions" }).click();
  await expect(page.getByTestId("shell-row-txn_1")).toBeVisible();
  expect(await checkedRowIds(page)).toEqual([]);
  await expect(
    page.getByText("Selection changes: 2. Last: none"),
  ).toBeVisible();
});
