/**
 * Browser coverage for the wheel date picker: staged drafts, bounds, clearing,
 * and ranges.
 */
import { expect, test } from "@playwright/test";

test("wheel date field stages a draft and commits the clamped date on Done", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  // The wheel variant uses the tap trigger (no editable input) on web too.
  const trigger = page.getByRole("button", { name: "Year ends: 31 Mar 2026" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const sheet = page.getByRole("dialog", { name: "Year ends" });
  await expect(sheet).toBeVisible();
  // The opened wheel shows the current value's columns.
  await expect(page.getByRole("button", { name: "Month Mar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Year 2026" })).toBeVisible();

  // Spinning to February clamps the 31st down to the month's last valid day,
  // and the draft is not committed until Done: the modal sheet stays open
  // (it does not auto-commit and close), so the trigger keeps its value.
  await page.getByRole("button", { name: "Month Feb" }).click();
  await expect(sheet).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  // Closing the sheet must not bounce it back open (focus returns to the trigger).
  await expect(page.getByRole("button", { name: "Done" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: 28 Feb 2026" }),
  ).toBeVisible();
});

test("wheel date field discards the draft on Cancel", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  await page.getByRole("button", { name: "Year ends: 31 Mar 2026" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeVisible();

  await page.getByRole("button", { name: "Month Jan" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  // Cancel leaves the committed value untouched.
  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();
});

test("bounded wheel date field disables out-of-range rows and commits in range", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-wheel-date-field");

  await page
    .getByRole("button", { name: "Delivery date: 15 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Delivery date" }),
  ).toBeVisible();

  // Only 10–20 Mar 2026 is selectable, so rows outside the window are disabled.
  await expect(page.getByRole("button", { name: "Day 5" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Jan" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Apr" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Day 16" })).toBeEnabled();

  await page.getByRole("button", { name: "Day 16" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Delivery date: 16 Mar 2026" }),
  ).toBeVisible();
});

test("clearable wheel date field clears its value without opening the wheel", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-wheel-date-field");

  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();

  // The clear button sits on the tap trigger; pressing it empties the field and
  // must not open the wheel sheet (clearing is a distinct action).
  await page.getByRole("button", { name: "Clear Year ends" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: Select a date" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("wheel date range opens an independent wheel per endpoint", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-range");

  // Each endpoint is its own wheel sheet. Open the start endpoint and re-pick it.
  await page
    .getByRole("button", { name: "Current period start: 1 Apr 2025" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period start" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Month May" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Current period start: 1 May 2025" }),
  ).toBeVisible();

  // The end endpoint opens its own wheel, unchanged by the start edit.
  await page
    .getByRole("button", { name: "Current period end: 31 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period end" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", { name: "Current period end: 31 Mar 2026" }),
  ).toBeVisible();
});
