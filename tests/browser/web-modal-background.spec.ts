import { expect, test } from "@playwright/test";

/**
 * How an open web modal treats the rest of the page. It hides the page from
 * assistive tech and from focus, but not the shared live regions, and only
 * the top modal of a stack traps Tab.
 */
const SHEET_STORY =
  "/iframe.html?id=dropdown-tag-picker--tag-sheet&viewMode=story";
const SHEET_IN_MODAL_STORY =
  "/iframe.html?id=dropdown-tag-picker--tag-sheet-in-modal&viewMode=story";
const TOAST_OVER_MODAL_STORY =
  "/iframe.html?id=modal-examples--toast-over-modal&viewMode=story";

test("a modal that opens over the live region leaves it exposed", async ({
  page,
}) => {
  await page.goto(SHEET_STORY);
  const trigger = page.getByRole("button", { name: "Tags, Add tag" });
  const sheet = page.getByRole("dialog", { name: "Tags" });
  const input = sheet.getByRole("combobox", { name: "Tags" });
  const region = page.locator("#firna-ui-live-region-polite");

  // The first result count creates the live region while the sheet is open.
  await trigger.click();
  await input.fill("web");
  await expect(region).toHaveText("1 option available");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  // The second sheet opens over the existing region.
  await trigger.click();
  await expect(sheet).toBeVisible();
  await expect(region).not.toHaveAttribute("inert");
  await expect(region).not.toHaveAttribute("aria-hidden");
  await input.fill("flat");
  await expect(region).toHaveText("2 options available");
});

test("a toast that shows while a modal is open is announced", async ({
  page,
}) => {
  await page.goto(TOAST_OVER_MODAL_STORY);
  const modal = page.getByRole("dialog", { name: "Edit transaction" });
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Save" }).click();

  // The toast live region existed before the modal opened.
  const region = page.locator('[aria-live="polite"][aria-atomic="true"]');
  await expect(region).toContainText("Saved. Your changes were saved.");
  expect(
    await region.evaluate(
      (node) => node.closest('[inert], [aria-hidden="true"]') === null,
    ),
  ).toBe(true);
});

test("a sheet opened from a modal traps Tab on its own", async ({ page }) => {
  await page.goto(SHEET_IN_MODAL_STORY);
  const modal = page.getByRole("dialog", { name: "Edit transaction" });
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Tags, Add tag" }).click();
  const sheet = page.getByRole("dialog", { name: "Tags" });
  const input = sheet.getByRole("combobox", { name: "Tags" });
  await expect(input).toBeFocused();

  // Tab visits every control of the sheet in order, then wraps.
  await page.keyboard.press("Tab");
  await expect(sheet.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    sheet.getByRole("button", { name: "Remove Loft conversion" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    sheet.getByRole("button", { name: "Remove Loft conversion" }),
  ).toBeFocused();

  // Done closes the sheet only, and the modal's form gets focus back.
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Tags, Add tag" }),
  ).toBeFocused();
});
