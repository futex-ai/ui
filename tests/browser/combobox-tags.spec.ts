import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { chipRemoveNames } from "./comboboxTags";

/**
 * The grouped tag picker (`ComboboxMultiSelect` with `group`, `description`,
 * `disabled`, `lockedValues`, `singlePerGroup`, and `footerAction`) in the
 * popover presentation, driven through the `GroupedTagPickerExample` stories.
 * The sheet presentation is in `combobox-tags-sheet.spec.ts`.
 */
const TAGS_STORY =
  "/iframe.html?id=dropdown-tag-picker--grouped-tags&viewMode=story";

async function openTags(page: Page) {
  await page.goto(TAGS_STORY);
  const input = page.getByRole("combobox", { name: "Tags" });
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  return input;
}

test("tag groups are labelled and a group name finds the whole group", async ({
  page,
}) => {
  const input = await openTags(page);
  const properties = page.getByRole("group", { name: "Properties" });
  await expect(properties.getByRole("option")).toHaveCount(2);
  await expect(
    page.getByRole("group", { name: "Vehicles" }).getByRole("option"),
  ).toHaveCount(2);

  // A group-name match shows the whole group, ignoring case; other groups go.
  await input.fill("VEHIC");
  const vehicles = page.getByRole("group", { name: "Vehicles" });
  await expect(vehicles.getByRole("option")).toHaveText([
    /Renault Kangoo BX19 KLM/,
    /Skoda Octavia WK21 LMN/,
  ]);
  await expect(properties).toHaveCount(0);

  // A label match keeps only that option and its group heading.
  await input.fill("website");
  await expect(
    page.getByRole("group", { name: "Projects" }).getByRole("option"),
  ).toHaveText([/Website rebuild/]);
  await expect(page.getByRole("group")).toHaveCount(1);
});

test("a disabled tag is listed with its reason but cannot be chosen", async ({
  page,
}) => {
  const input = await openTags(page);
  const skoda = page.getByRole("option", { name: "Skoda Octavia WK21 LMN" });
  await expect(skoda).toHaveAttribute("aria-disabled", "true");
  await expect(skoda).toHaveAccessibleDescription("Consultancy trade");

  await skoda.click({ force: true });
  await expect(skoda).toHaveAttribute("aria-selected", "false");

  // The arrow keys skip it: from the Renault row (the first choosable row, so
  // active on open), ArrowDown lands on the next choosable row in Projects.
  // The pointer leaves the list first so a hovered row cannot take over.
  await page.mouse.move(0, 0);
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await page
      .getByRole("option", { name: "Renault Kangoo BX19 KLM" })
      .getAttribute("id")) ?? "",
  );
  await page.keyboard.press("ArrowDown");
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await page
      .getByRole("option", { name: "Loft conversion" })
      .getAttribute("id")) ?? "",
  );
  expect(await chipRemoveNames(page)).not.toContain(
    "Remove Skoda Octavia WK21 LMN",
  );
});

test("a locked tag has no remove button and its row cannot be toggled", async ({
  page,
}) => {
  await openTags(page);
  expect(await chipRemoveNames(page)).toEqual(["Remove Loft conversion"]);

  const flat2 = page.getByRole("option", { name: "Flat 2, 14 Brook Street" });
  await expect(flat2).toHaveAttribute("aria-selected", "true");
  await expect(flat2).toHaveAttribute("aria-disabled", "true");
  await flat2.click({ force: true });
  await expect(flat2).toHaveAttribute("aria-selected", "true");

  // One tag per group: the locked property blocks the other properties.
  await expect(
    page.getByRole("option", { name: "Flat 3, 14 Brook Street" }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("one tag per group: choosing a tag replaces the group's tag", async ({
  page,
}) => {
  await openTags(page);
  await page.getByRole("option", { name: "Website rebuild" }).click();
  expect(await chipRemoveNames(page)).toEqual(["Remove Website rebuild"]);

  // Choosing the selected tag again removes it.
  await page.getByRole("option", { name: "Website rebuild" }).click();
  expect(await chipRemoveNames(page)).toEqual([]);
  await expect(
    page.getByRole("option", { name: "Flat 2, 14 Brook Street" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("the footer action runs from the keyboard with the query", async ({
  page,
}) => {
  const input = await openTags(page);
  const action = page.getByRole("option", { name: "Create tag" });
  await expect(action).toBeVisible();

  // The list opens on its first choosable row (the locked and blocked
  // properties are skipped); ArrowUp from there wraps to the pinned action.
  await page.keyboard.press("ArrowUp");
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await action.getAttribute("id")) ?? "",
  );

  // With no match the action is the active row, named from the query.
  await input.fill("van");
  const createVan = page.getByRole("option", { name: "Create tag “van”" });
  await expect(createVan).toBeVisible();
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await createVan.getAttribute("id")) ?? "",
  );
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.getByText("Created tag: van")).toBeVisible();
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toHaveValue("");
  expect(await chipRemoveNames(page)).toContain("Remove van");
});

test("the open tag list has no axe violations", async ({ page }) => {
  await openTags(page);
  await page.getByRole("combobox", { name: "Tags" }).fill("o");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
