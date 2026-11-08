/** Browser coverage for the dark-theme stories across component families. */
import { expect, test } from "@playwright/test";

import { backgroundColor } from "./computedStyleHelpers";

// --- Dark theme ----------------------------------------------------------
//
// The dark stories are additive (new ids), so the light-theme assertions in
// the component specs are untouched. Each of these pins a value that could
// only come from the dark palette flowing through the new primitives:
// `onSolid` is the near-black page ink-well `#141613` = rgb(20, 22, 19), the
// inverse of the light themes' white. The axe sweep in a11y.spec.ts covers the
// palettes' contrast in situ; these pin the specific wiring.

test("dark badge solid label uses the onSolid ink-well", async ({ page }) => {
  await page.goto("/iframe.html?id=badge-examples--dark&viewMode=story");

  // The story renders the soft row then the solid row, so the second "Active"
  // is the solid badge's label.
  const solidLabel = page.getByText("Active", { exact: true }).nth(1);
  await expect(solidLabel).toHaveCSS("color", "rgb(20, 22, 19)");
  // The fill sits on the pill wrapping the label: the dark preset's lightened
  // primaryDeep (#a3cdb4) — the solid-inversion model, light fill/dark content.
  await expect(solidLabel.locator("xpath=..")).toHaveCSS(
    "background-color",
    "rgb(163, 205, 180)",
  );
});

test("dark switch on-knob flips to onSolid over the light track", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=switch-examples--dark&viewMode=story");

  // Pressable > track > knob; the story's switch renders in the on-position.
  const control = page.getByRole("switch", { name: "Analytics cookies" });
  const track = control.locator("div").first();
  const knob = control.locator("div").last();
  await expect(track).toHaveCSS("background-color", "rgb(122, 167, 142)");
  await expect(knob).toHaveCSS("background-color", "rgb(20, 22, 19)");

  // Toggling off drops the knob to the light `ink` over the dark border2 track
  // — the one place a component branches on `theme.scheme`.
  await control.click();
  await expect(track).toHaveCSS("background-color", "rgb(58, 64, 58)");
  await expect(knob).toHaveCSS("background-color", "rgb(230, 233, 228)");
});

test("dark dropdown solid active row inverts content to onSolid", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dark&viewMode=story");

  await page.getByRole("button", { name: "Open action menu" }).click();
  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  await expect(settings).toBeVisible();

  // The preselected row carries the solid `primary` fill, and its label is
  // inverted through `onSolid` rather than the light themes' hardcoded white.
  await expect.poll(() => backgroundColor(settings)).toBe("rgb(122, 167, 142)");
  await expect(page.getByText("Settings", { exact: true })).toHaveCSS(
    "color",
    "rgb(20, 22, 19)",
  );
});

test("dark data grid picks the scheme-gated fixed pill pairs", async ({
  page,
}) => {
  // The DataGrid stories live under the `datagrid-` id prefix.
  await page.goto("/iframe.html?id=datagrid-examples--dark&viewMode=story");
  await page.waitForSelector("#storybook-root *");

  // `blue` has no token family to ride, so it switches to its fixed dark pair.
  const channel = page.getByText("twitter/x", { exact: true }).first();
  await expect(channel).toHaveCSS("color", "rgb(168, 200, 238)");
  await expect(channel.locator("xpath=..")).toHaveCSS(
    "background-color",
    "rgb(28, 42, 58)",
  );
});

test("dark story surface paints its own theme background", async ({ page }) => {
  await page.goto("/iframe.html?id=theme-examples--dark-accounting-theme");

  // StorySurface paints `colors.bg`; without it the dark panel would composite
  // over the light Storybook canvas and the axe sweep would fail it.
  await expect(page.getByText("darkSharedUiTheme")).toBeVisible();
  // The web theme provider contributes a boxless variable scope; the painted
  // StorySurface remains its direct View child.
  const surface = page.locator("#storybook-root > div > .firna-view").first();
  await expect(surface).toHaveCSS("background-color", "rgb(20, 22, 19)");
});
