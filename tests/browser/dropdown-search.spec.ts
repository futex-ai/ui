/**
 * Browser coverage for searchable selectors and the combobox: filtering while
 * the input keeps focus.
 */
import { expect, test } from "@playwright/test";

test("searchable dropdown selector filters options and selects by keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--searchable-selector");

  await page.getByRole("button", { name: "Currency, US Dollar" }).click();

  // The search input is focused on open. Typing (including the space bar, which
  // must reach the input rather than activate a row) narrows the option rows
  // while keeping focus in the input.
  const search = page.getByPlaceholder("Search options");
  await expect(search).toBeFocused();

  // The search field's border lines up with the option rows' (selected)
  // background, so its left and right edges match the highlighted row.
  const alignment = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Search options"]');
    const field = input?.parentElement ?? null;
    const selectedRow =
      Array.from(document.querySelectorAll('[role="option"]')).find(
        (element) => element.textContent?.trim() === "US Dollar",
      ) ?? null;
    if (!field || !selectedRow) {
      return null;
    }
    const fieldRect = field.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    return {
      left: Math.abs(fieldRect.left - rowRect.left),
      right: Math.abs(fieldRect.right - rowRect.right),
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.left).toBeLessThanOrEqual(1);
  expect(alignment?.right).toBeLessThanOrEqual(1);

  await search.pressSequentially("new z");
  await expect(
    page.getByRole("option", { exact: true, name: "New Zealand Dollar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "US Dollar" }),
  ).toBeHidden();
  await expect(search).toBeFocused();

  // Enter activates the highlighted match and closes the menu.
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Currency, New Zealand Dollar" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search options")).toBeHidden();

  // Reopening starts from the full list again; a non-matching query shows the
  // empty state.
  await page
    .getByRole("button", { name: "Currency, New Zealand Dollar" })
    .click();
  await page.getByPlaceholder("Search options").fill("zzz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "Euro" }),
  ).toBeHidden();
});

test("combobox keeps input focus while filtering options", async ({ page }) => {
  await page.goto("/iframe.html?id=dropdown-examples--input-backed-combobox");

  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("pay");

  await expect(page.getByText("Payroll Reserve")).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("zz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(input).toBeFocused();
  await expect(
    page.getByText("Only active books can be selected."),
  ).toBeVisible();
});
