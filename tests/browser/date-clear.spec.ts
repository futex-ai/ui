/** Browser coverage for the date field's clear button. */
import { expect, test } from "@playwright/test";

test("date field clears its value with the clear button", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // Exact match so the clear button ("Clear Year ends") is not also selected.
  const input = page.getByLabel("Year ends", { exact: true });
  await expect(input).toHaveValue("31 Mar 2026");

  // Open the calendar, then clear: clearing empties the field and closes the
  // calendar without popping a fresh one (focus returns to the empty input).
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "Clear Year ends" }).click();

  await expect(input).toHaveValue("");
  await expect(page.getByText("March 2026")).toBeHidden();
  await expect(page.getByText("June 2026")).toBeHidden();
  // The clear button is gone once there is nothing left to clear.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("date field clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });

  // Tabbing from the input reaches the clear button (the calendar icon is
  // tabIndex=-1 and skipped).
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();

  // Activating it via the keyboard clears the value and returns focus to the
  // now-empty input rather than dropping focus to the body.
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
});

test("date clear button tracks the committed value, not the typed buffer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");

  // Deleting all the text mid-edit does NOT commit (empty is unparseable), so
  // the committed date remains and the clear button stays visible.
  await input.focus();
  await input.fill("");
  await expect(clear).toBeVisible();

  // Now actually clear it, then type unparseable partial text into the empty
  // field: there is no committed value, so no clear button appears.
  await clear.click();
  await expect(input).toHaveValue("");
  await input.fill("5 Ju");
  await expect(clear).toBeHidden();
});
