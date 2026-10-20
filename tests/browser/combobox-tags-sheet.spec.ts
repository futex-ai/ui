import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { chipRemoveNames } from "./comboboxTags";

/**
 * The grouped tag picker in the sheet presentation, driven through the
 * `GroupedTagPickerExample` sheet stories.
 */
const SHEET_STORY =
  "/iframe.html?id=dropdown-tag-picker--tag-sheet&viewMode=story";
const OPEN_SHEET_STORY =
  "/iframe.html?id=dropdown-tag-picker--tag-sheet-open&viewMode=story";

async function openSheet(page: Page) {
  await page.goto(SHEET_STORY);
  const trigger = page.getByRole("button", { name: "Tags, Add tag" });
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Tags" });
  await expect(sheet).toBeVisible();
  const input = sheet.getByRole("combobox", { name: "Tags" });
  await expect(input).toBeFocused();
  return { input, sheet, trigger };
}

test("the sheet presentation holds the search, the list, and a Done action", async ({
  page,
}) => {
  const { input, sheet, trigger } = await openSheet(page);

  await input.fill("web");
  await page.keyboard.press("Enter");
  // Choosing keeps the sheet open for the next tag and clears the search.
  await expect(sheet).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(
    sheet.getByRole("option", { name: "Website rebuild" }),
  ).toHaveAttribute("aria-selected", "true");

  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await chipRemoveNames(page)).toEqual(["Remove Website rebuild"]);

  // Escape closes it too.
  await trigger.click();
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("keys on the sheet's buttons reach those buttons, not the list", async ({
  page,
}) => {
  const { sheet } = await openSheet(page);
  const renault = sheet.getByRole("option", {
    name: "Renault Kangoo BX19 KLM",
  });

  // Enter on a chip's remove button removes that chip; the active option row
  // (Renault, the first choosable row) is not toggled.
  await sheet.getByRole("button", { name: "Remove Loft conversion" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    sheet.getByRole("button", { name: "Remove Loft conversion" }),
  ).toHaveCount(0);
  await expect(renault).toHaveAttribute("aria-selected", "false");

  // Enter on Done closes the sheet without choosing anything.
  await sheet.getByRole("button", { name: "Done" }).focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toBeHidden();
  expect(await chipRemoveNames(page)).toEqual([]);
});

test("a tap on a row keeps focus in the sheet's search", async ({ page }) => {
  const { input, sheet } = await openSheet(page);
  await sheet.getByRole("option", { name: "Website rebuild" }).click();
  await expect(input).toBeFocused();

  await page.keyboard.type("flat 3");
  await expect(input).toHaveValue("flat 3");
  expect(await chipRemoveNames(page)).toEqual(["Remove Website rebuild"]);
});

test("the sheet gives focus back to its button after a press that did not focus it", async ({
  page,
}) => {
  // The story opens the sheet with `HTMLElement.click()`. Like a click in
  // WebKit, that press does not focus the button.
  await page.goto(OPEN_SHEET_STORY);
  const sheet = page.getByRole("dialog", { name: "Tags" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Tags, Add tag" }),
  ).toBeFocused();
});

test("the Create tag row runs from the sheet with the query", async ({
  page,
}) => {
  const { input, sheet, trigger } = await openSheet(page);
  await input.fill("van");
  // With no match, the pinned row is the active row, named from the query.
  const create = sheet.getByRole("option", { name: "Create tag “van”" });
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await create.getAttribute("id")) ?? "",
  );
  await page.keyboard.press("Enter");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByText("Created tag: van")).toBeVisible();
  expect(await chipRemoveNames(page)).toContain("Remove van");
});

test("Tab skips the option rows, and Space types into the search", async ({
  page,
}) => {
  const { input, sheet } = await openSheet(page);
  const active = await input.getAttribute("aria-activedescendant");

  // The list is one Tab stop: Tab leaves the input for a button, never a row.
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("role", "button");
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();

  // Space is text in the search, not a choice of the active row.
  await page.keyboard.press("Space");
  await expect(input).toHaveValue(" ");
  await expect(input).toHaveAttribute("aria-activedescendant", active ?? "");
  expect(await chipRemoveNames(page)).toEqual(["Remove Loft conversion"]);
  await expect(sheet).toBeVisible();
});

test("the open sheet describes its search and has no axe violations", async ({
  page,
}) => {
  await page.goto(OPEN_SHEET_STORY);
  const sheet = page.getByRole("dialog", { name: "Tags" });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("combobox", { name: "Tags" }),
  ).toHaveAccessibleDescription("Choose one tag per group.");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
