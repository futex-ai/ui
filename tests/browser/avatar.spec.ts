/**
 * Browser coverage for the avatar: initials, sizes, shapes, and the loading
 * state.
 */
import { expect, test } from "@playwright/test";

test("avatar renders initials and sizes the disc from the size prop", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=avatar-examples--user-avatars");

  // The solid (default) and soft variants both render their initials.
  await expect(page.getByText("GS", { exact: true })).toBeVisible();
  await expect(page.getByText("PR", { exact: true })).toBeVisible();
  await expect(page.getByText("AR", { exact: true })).toHaveCSS(
    "color",
    "rgb(116, 81, 31)",
  );
  await expect(page.locator('[aria-label="Accounts Receivable"]')).toHaveCSS(
    "background-color",
    "rgb(244, 236, 216)",
  );

  // The accessibilityLabel names the disc for assistive tech, and the size prop
  // drives the rendered circle (size={48} → a 48x48 disc).
  const sized = page.locator('[aria-label="Vivienne Archer"]');
  await expect(sized).toBeVisible();
  const box = await sized.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(47);
  expect(box?.width).toBeLessThanOrEqual(49);
  expect(box?.height).toBeGreaterThanOrEqual(47);
  expect(box?.height).toBeLessThanOrEqual(49);
});

test("avatar shape=square rounds corners proportionally to size", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=avatar-examples--shapes");

  // radii.avatarRatio defaults to 0.25, so a 32px square gets an 8px corner
  // and a 64px square gets 16px — while a circle keeps size / 2. The longhand
  // corner property is asserted because Chromium does not always serialize
  // the `border-radius` shorthand in computed styles.
  await expect(page.locator('[aria-label="Circle 32"]')).toHaveCSS(
    "border-top-left-radius",
    "16px",
  );
  await expect(page.locator('[aria-label="Square 32"]')).toHaveCSS(
    "border-top-left-radius",
    "8px",
  );
  await expect(page.locator('[aria-label="Square 64"]')).toHaveCSS(
    "border-top-left-radius",
    "16px",
  );
});

test("avatar loading swaps the initials for a busy dot-grid progressbar", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=avatar-examples--loading");

  // While loading the disc reports itself as a busy progress indicator under
  // the same accessible name, instead of as an image of the person.
  const disc = page.getByRole("progressbar", { name: "Loading 32" });
  await expect(disc).toBeVisible();
  await expect(disc).toHaveAttribute("aria-busy", "true");

  // The initials are gone and the nine dots of the 3x3 grid are drawn in their
  // place, in the solid tone's white foreground. The dots are the only leaf
  // elements under the disc; everything above them is grid/row scaffolding.
  await expect(disc.getByText("GS")).toHaveCount(0);
  const dots = disc.locator("div:not(:has(*))");
  await expect(dots).toHaveCount(9);
  await expect(dots.first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );

  // A palette disc draws its dots in the `textColor` override it would have
  // used for the initials, keeping the contrast contract while loading.
  await expect(
    page
      .getByRole("progressbar", { name: "Accounts Receivable" })
      .locator("div:not(:has(*))")
      .first(),
  ).toHaveCSS("background-color", "rgb(116, 81, 31)");

  // The box does not change size when the load finishes: the loading and
  // settled 32px avatars in the last row occupy the same footprint.
  const loadingBox = await page
    .getByRole("progressbar", { name: "Vivienne Archer" })
    .boundingBox();
  const settledBox = await page
    .getByRole("img", { name: "Vivienne Archer" })
    .boundingBox();
  expect(loadingBox?.width).toBe(settledBox?.width);
  expect(loadingBox?.height).toBe(settledBox?.height);
});
