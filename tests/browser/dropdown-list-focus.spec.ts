import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * A dropdown list is one Tab stop. When a combobox input controls the list,
 * the input is that stop. Otherwise the list itself is the stop, so a list
 * that scrolls stays reachable from the keyboard. Rows are never Tab stops.
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test("an open scrolling selector list has no axe violations", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--long-dropdown-selector");
  await page.getByRole("button", { name: /Long option 01/ }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

test("a selector list is one Tab stop that points at the active row", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--long-dropdown-selector");
  await page.getByRole("button", { name: /Long option 01/ }).click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("option").first()).toHaveAttribute(
    "tabindex",
    "-1",
  );

  // The list names its active row, and the arrow keys move it.
  const second = page.getByRole("option", { name: "Long option 02" });
  await page.keyboard.press("ArrowDown");
  await expect(listbox).toHaveAttribute(
    "aria-activedescendant",
    (await second.getAttribute("id")) ?? "",
  );
});
