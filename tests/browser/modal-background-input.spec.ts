import { expect, test, type Page } from "@playwright/test";

/**
 * Background overlays under web dialogs, on the "Dialogs over open overlays"
 * story: a column menu that stays open after its action opens a dialog, and a
 * filters popover that stays open around a dialog rendered in its content. An
 * overlay under a dialog is background, so its document listeners leave the
 * dialog's typing and presses alone, and it is live again once the dialog
 * closes (`docs/protocol/web-overlays.md`).
 */

const OVERLAYS_STORY =
  "/iframe.html?id=modal-examples--dialogs-over-open-overlays";

/** The story's overlays, dialogs, and fields, found in hidden subtrees too. */
function overlayControls(page: Page) {
  const dialog = (name: string) =>
    page.getByRole("dialog", { includeHidden: true, name });
  const field = (name: string) =>
    page.getByRole("textbox", { includeHidden: true, name });
  return {
    addColumn: dialog("Add column"),
    columnMenu: page.getByRole("menu", {
      includeHidden: true,
      name: "Column options",
    }),
    columnName: field("Column name"),
    filters: dialog("Filters"),
    saveView: dialog("Save view"),
    viewName: field("View name"),
  };
}

test("typing in a dialog opened from an open menu reaches the dialog", async ({
  page,
}) => {
  const ui = overlayControls(page);
  await page.goto(OVERLAYS_STORY);
  await page.getByRole("button", { exact: true, name: "Columns" }).click();
  await page.getByRole("menuitem", { name: "Add column…" }).click();
  await expect(ui.addColumn).toBeVisible();
  await expect(ui.columnMenu).toBeVisible();
  await expect(ui.columnName).toBeFocused();
  await page.keyboard.type("Due date");
  await expect(
    ui.columnName,
    "the background menu leaves the space to the dialog field",
  ).toHaveValue("Due date");
  await page.keyboard.press("Escape");
  await expect(ui.addColumn).toBeHidden();
  await expect(ui.columnMenu, "the menu is live again").toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ui.columnMenu).toBeHidden();
});

test("a press in a dialog inside an open popover keeps the dialog open", async ({
  page,
}) => {
  const ui = overlayControls(page);
  await page.goto(OVERLAYS_STORY);
  await page.getByRole("button", { exact: true, name: "Filters" }).click();
  await expect(ui.filters).toBeVisible();
  await page
    .getByRole("button", { exact: true, name: "Save as view…" })
    .click();
  await expect(ui.saveView).toBeVisible();
  await ui.viewName.click();
  await expect(
    ui.saveView,
    "the background popover does not read the press as an outside press",
  ).toBeVisible();
  await expect(ui.viewName).toBeFocused();
  await page.keyboard.type("Paid in March");
  await expect(ui.viewName).toHaveValue("Paid in March");
  await page.keyboard.press("Escape");
  await expect(ui.saveView).toBeHidden();
  await expect(ui.filters, "the popover is live again").toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ui.filters).toBeHidden();
});
