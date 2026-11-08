/**
 * Browser coverage for dropdown menus: action menus, the highlighted row's
 * colours, and the hover, long-press, and context triggers.
 */
import { expect, test } from "@playwright/test";

import { backgroundColor, textColor } from "./computedStyleHelpers";

test("dropdown action menu opens from child trigger and closes after selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  const trigger = page.getByRole("button", { name: "Open action menu" });
  // The trigger advertises its popup to assistive tech in every mode.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  await expect(settings).toBeVisible();
  await expect(
    page.getByRole("menuitem", { exact: true, name: "Remove" }),
  ).toBeVisible();

  await settings.click();
  await expect(page.getByText("Last action: Settings")).toBeVisible();
  await expect(settings).toBeHidden();
});

test("dropdown action menu preselects first row and tracks hover selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  await page.getByRole("button", { name: "Open action menu" }).click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  const remove = page.getByRole("menuitem", { exact: true, name: "Remove" });
  await expect(settings).toBeVisible();
  await expect(remove).toBeVisible();

  // Settings (default tone) is preselected, so it carries the primary green
  // solid fill while the resting danger row stays flat (transparent).
  const settingsFill = await backgroundColor(settings);
  expect(settingsFill).not.toBe("rgba(0, 0, 0, 0)");
  expect(await backgroundColor(remove)).toBe("rgba(0, 0, 0, 0)");

  await remove.hover();
  // Hover moves the highlight to the danger row, which fills with the deep-rose
  // danger color (rgb(143, 58, 48)) rather than the primary green, and Settings
  // falls back to flat.
  await expect.poll(() => backgroundColor(remove)).toBe("rgb(143, 58, 48)");
  await expect.poll(() => backgroundColor(settings)).toBe("rgba(0, 0, 0, 0)");

  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Remove")).toBeVisible();
  await expect(remove).toBeHidden();

  await page.getByRole("button", { name: "Open action menu" }).click();
  await expect(settings).toBeVisible();
  await expect.poll(() => backgroundColor(settings)).toBe(settingsFill);
  await expect.poll(() => backgroundColor(remove)).toBe("rgba(0, 0, 0, 0)");
});

test("dropdown action menu keeps row subtext legible on the solid highlight", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-action-menu-subtext",
  );

  await page.getByRole("button", { name: "Open settings menu" }).click();

  const activeSubtext = page.getByText("Members, roles & billing");
  const restingSubtext = page.getByText("Permanently delete this workspace");
  await expect(activeSubtext).toBeVisible();
  await expect(restingSubtext).toBeVisible();

  // The first row is preselected, so it carries the solid `primary` fill. Its
  // subtext must invert to the surface white (rgb(255, 255, 255)) — the muted
  // grey it otherwise inherits all but vanishes against the fill. The resting
  // row keeps the muted grey (rgb(105, 112, 106)) on the plain surface.
  await expect.poll(() => textColor(activeSubtext)).toBe("rgb(255, 255, 255)");
  expect(await textColor(restingSubtext)).toBe("rgb(105, 112, 106)");

  // Moving the highlight to the resting row inverts its subtext and lets the
  // previously active row's subtext fall back to the muted grey.
  await page.getByRole("menuitem", { name: /Remove business/ }).hover();
  await expect.poll(() => textColor(restingSubtext)).toBe("rgb(255, 255, 255)");
  await expect.poll(() => textColor(activeSubtext)).toBe("rgb(105, 112, 106)");
});

test("dropdown danger row highlights red with legible text when active", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-action-menu-subtext",
  );

  await page.getByRole("button", { name: "Open settings menu" }).click();

  const removeRow = page.getByRole("menuitem", { name: /Remove business/ });
  const removeLabel = page.getByText("Remove business", { exact: true });

  // Resting: the danger row carries its rose accent label on the plain surface.
  expect(await textColor(removeLabel)).toBe("rgb(168, 79, 69)");

  await removeRow.hover();

  // Active: the highlight swaps to the deep-rose danger fill (rgb(143, 58, 48))
  // rather than the primary green, and the label inverts to white so the
  // destructive action stays legible instead of red-on-green.
  await expect.poll(() => backgroundColor(removeRow)).toBe("rgb(143, 58, 48)");
  await expect.poll(() => textColor(removeLabel)).toBe("rgb(255, 255, 255)");
});

test("dropdown row icons tint with the active row instead of staying dark", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-action-menu-tinted-icons",
  );

  await page.getByRole("button", { name: "Open tinted action menu" }).click();

  // lucide glyphs render through react-native-svg, which paints the tint on the
  // root `stroke` attribute rather than a CSS color.
  const iconStroke = (name: string | RegExp) =>
    page
      .getByRole("menuitem", { name })
      .locator("svg")
      .first()
      .getAttribute("stroke");

  await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible();

  // The first row is preselected, so it carries the solid `primary` fill. Its
  // leading icon is a caller-owned node, so before slots could resolve against
  // the row color it kept whatever the caller hard-coded and read as near-black
  // on the fill while the label beside it inverted to white.
  await expect.poll(() => iconStroke("Settings")).toBe("#ffffff");
  // Resting rows keep the base ink, and a resting danger row takes the rose
  // accent that matches its label.
  expect(await iconStroke("Pin")).toBe("#1c1f1d");
  expect(await iconStroke("Remove")).toBe("#a84f45");

  // Moving the highlight inverts the newly active icon and lets the previously
  // active one fall back to ink — including over the deep-rose danger fill.
  await page.getByRole("menuitem", { name: "Remove" }).hover();
  await expect.poll(() => iconStroke("Remove")).toBe("#ffffff");
  await expect.poll(() => iconStroke("Settings")).toBe("#1c1f1d");
});

test("dropdown selector keeps trailing codes legible on the solid highlight", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--category-select");

  await page.getByRole("button", { name: "Category, Rental income" }).click();

  const activeMeta = page.getByText("4020");
  const restingMeta = page.getByText("4000");
  await expect(activeMeta).toBeVisible();
  await expect(restingMeta).toBeVisible();

  // The selected row ("Rental income") is preselected, so it carries the solid
  // `primary` fill. Its trailing code must invert to surface white
  // (rgb(255, 255, 255)) — the muted grey it otherwise keeps all but vanishes
  // against the fill (~1.2:1). A resting row stays muted (rgb(105, 112, 106)).
  await expect.poll(() => textColor(activeMeta)).toBe("rgb(255, 255, 255)");
  expect(await textColor(restingMeta)).toBe("rgb(105, 112, 106)");

  // Moving the highlight to a resting row inverts its code and lets the
  // previously active row's code fall back to the muted grey.
  await page.getByRole("option", { name: /Sales/ }).hover();
  await expect.poll(() => textColor(restingMeta)).toBe("rgb(255, 255, 255)");
  await expect.poll(() => textColor(activeMeta)).toBe("rgb(105, 112, 106)");
});

test("dropdown hover menu opens on pointer hover and closes on hover out", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-hover-menu");

  const trigger = page.getByRole("button", { name: "Open hover menu" });
  const profile = page.getByRole("menuitem", { exact: true, name: "Profile" });

  await trigger.hover();
  await expect(profile).toBeVisible();

  // Move the pointer well away from the trigger and surface to hover out.
  await page.mouse.move(5, 5);
  await expect(profile).toBeHidden();
});

test("dropdown long-press menu opens on press-and-hold, not a plain tap", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-long-press-menu",
  );

  const trigger = page.getByRole("button", { name: "Open long-press menu" });
  const rename = page.getByRole("menuitem", { exact: true, name: "Rename" });

  // A quick tap must not open a long-press menu.
  await trigger.click();
  await expect(rename).toBeHidden();

  // Press and hold past the long-press delay opens it.
  const box = await trigger.boundingBox();
  if (!box) {
    throw new Error("long-press trigger not found");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();

  await expect(rename).toBeVisible();
});

test("dropdown context menu opens on right-click, not on a left click", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-context-menu");

  const trigger = page.getByRole("button", { name: "Open context menu" });
  const copy = page.getByRole("menuitem", { exact: true, name: "Copy" });

  // A left click must not open a context menu.
  await trigger.click();
  await expect(copy).toBeHidden();

  await trigger.click({ button: "right" });
  await expect(copy).toBeVisible();
});
