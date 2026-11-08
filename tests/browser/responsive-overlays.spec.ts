/** Browser coverage for responsive popovers and menus, and the web sheet. */
import { expect, test } from "@playwright/test";

test("responsive popover opens an anchored dialog with focus management and a nested selector", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-popover-web");

  const trigger = page.getByRole("button", { name: "Filters" });
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // Opening moves focus into the surface (web focus management) and exposes the
  // named dialog anchored to the trigger.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const focusInDialog = await page.evaluate(() => {
    const surface = document.querySelector('[role="dialog"]');
    return surface
      ? surface === document.activeElement ||
          surface.contains(document.activeElement)
      : false;
  });
  expect(focusInDialog).toBe(true);

  // The nested selector's menu escapes the dialog's clip box; selecting an
  // option updates the field and leaves the dialog open (non-modal anchored
  // surface + the shared descendant-aware dismissal).
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  // Escape closes the top layer (menu) first, the dialog second, and focus
  // returns to the trigger.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("responsive menu navigates with the keyboard while focus rests on the dialog surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-menu-story");

  const trigger = page.getByRole("button", { name: "Row actions" });
  const dialog = page.getByRole("dialog", { name: "Row actions" });
  await expect(dialog).toBeHidden();

  await trigger.click();
  await expect(dialog).toBeVisible();
  // The rows are exposed as menuitems inside the dialog.
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();

  // Focus lands on the dialog surface, NOT inside the list — the exact condition
  // that leaves a bare DropdownList's arrow keys dead (its handler is bound to
  // the inner ScrollView). Navigation still works here because the menu owns a
  // document-level keydown listener that drives the active row.
  const focusOnSurface = await page.evaluate(() => {
    const surface = document.querySelector('[role="dialog"]');
    return surface !== null && surface === document.activeElement;
  });
  expect(focusOnSurface).toBe(true);

  // ArrowDown moves off the preselected first row (Rename) to Duplicate; Enter
  // runs it and closes the menu, returning focus to the trigger.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Duplicate")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // Reopening resets the active row to the first item, so a bare Enter selects
  // Rename with no arrow press.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Rename")).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("responsive menu surface suppresses the browser's default focus ring", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-menu-story");

  // Open via the keyboard so Chrome's `:focus-visible` heuristic engages — the
  // state where the UA would otherwise draw a heavy blue outline around the
  // whole surface (a mouse open never matches `:focus-visible`, so it hides the
  // regression).
  await page.getByRole("button", { name: "Row actions" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();

  const surface = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el.getAttribute("role") !== "dialog") return null;
    return {
      focusVisible: el.matches(":focus-visible"),
      outlineStyle: getComputedStyle(el).outlineStyle,
    };
  });
  // Focus lands on the dialog surface and it DOES match `:focus-visible`, yet the
  // UA outline is suppressed — the active row highlight is the focus affordance.
  expect(surface?.focusVisible).toBe(true);
  expect(surface?.outlineStyle).toBe("none");
});

test("web sheet opens the modal bottom-sheet placement and closes on Escape", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=sheet-examples--bottom-sheet");

  const sheet = page.getByRole("dialog", { name: "Line settings" });
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Open sheet" }).click();
  await expect(sheet).toBeVisible();

  // A selector nested in the sheet opens and selecting keeps the sheet open.
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(sheet).toBeVisible();

  // Escape closes the menu, then the sheet.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});
