/**
 * Browser coverage for the animated border: the moving trail, shapes, and
 * gradients.
 */
import { expect, test } from "@playwright/test";

test("animated border renders a continuously moving SVG trail", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=animatedborder-examples--active-icon");

  // The decorative border overlay is keyed by testID (RNW → data-testid).
  const border = page.locator('[data-testid="animated-border"]').first();
  await expect(border).toBeAttached();

  // The trail is real SVG geometry stroked in the theme primary, not a CSS
  // border — so it follows the rounded-rect corner on native and web alike.
  await expect(border.locator('rect[stroke="#4f7864"]').first()).toBeAttached();

  // It genuinely animates: the leading rect's stroke-dashoffset keeps advancing,
  // so a later sample differs from the first. This also guards the regression
  // where the array `style` that `Animated.createAnimatedComponent` injects
  // crashed the render with "Indexed property setter is not supported".
  const readOffset = () =>
    border.locator("rect").first().getAttribute("stroke-dashoffset");
  const firstOffset = await readOffset();
  await expect.poll(readOffset).not.toBe(firstOffset);
});

test("animated border shape=circle fully rounds the box (circle and pill)", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=animatedborder-examples--circles");

  // The first framed avatar is a 28px square, so shape="circle" fully rounds it
  // into a true circle: a rect whose corner radius is the maximum
  // (28 - 1.2 stroke) / 2 = 13.4, which SVG renders as a perfect circle.
  const disc = page.locator('[data-testid="animated-border"]').first();
  await expect(disc).toBeAttached();
  const discHead = disc.locator('rect[stroke="#4f7864"]').first();
  await expect(discHead).toBeAttached();
  await expect(discHead).toHaveAttribute("rx", "13.4");
  await expect(discHead).toHaveAttribute("width", "26.8");
  await expect(discHead).toHaveAttribute("height", "26.8");

  // The last framed box is a non-square 72×40, so shape="circle" traces an
  // elongated stadium/"pill": the same maximal radius (half the SHORTER side =
  // 19.4) but a rect spanning the FULL width (72 - 1.2 = 70.8), not a small
  // centered circle. This is the regression the fix targets.
  const pill = page.locator('[data-testid="animated-border"]').last();
  const pillHead = pill.locator('rect[stroke="#4f7864"]').first();
  await expect(pillHead).toHaveAttribute("rx", "19.4");
  await expect(pillHead).toHaveAttribute("width", "70.8");
  await expect(pillHead).toHaveAttribute("height", "38.8");

  // It genuinely animates: the leading rect's stroke-dashoffset keeps advancing
  // around the path, so a later sample differs from the first.
  const readOffset = () =>
    disc.locator("rect").first().getAttribute("stroke-dashoffset");
  const firstOffset = await readOffset();
  await expect.poll(readOffset).not.toBe(firstOffset);
});

test("animated border strokes a color pair through an SVG gradient", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=animatedborder-examples--gradient");

  // The first badge takes a `[from, to]` pair, so its trail is stroked with a
  // gradient rather than a flat color. The `url(#…)` reference has to resolve
  // against a real definition — which is what the per-instance, colon-free
  // gradient id buys, since `useId` alone emits ids that break the reference.
  const pair = page.locator('[data-testid="animated-border"]').first();
  const gradient = pair.locator("linearGradient");
  await expect(gradient).toHaveCount(1);
  const gradientId = await gradient.getAttribute("id");
  await expect(
    pair.locator(`rect[stroke="url(#${gradientId})"]`).first(),
  ).toBeAttached();

  // from → to → from: the pair's first color sits at BOTH ends with the second
  // through the middle, so the two sides of the border read the same instead of
  // ramping one way across the box.
  const stops = gradient.locator("stop");
  await expect(stops).toHaveCount(3);
  await expect(stops.nth(0)).toHaveAttribute("offset", "0");
  await expect(stops.nth(0)).toHaveAttribute("stop-color", "#36c5f0");
  await expect(stops.nth(1)).toHaveAttribute("offset", "0.5");
  await expect(stops.nth(1)).toHaveAttribute("stop-color", "#e01e5a");
  await expect(stops.nth(2)).toHaveAttribute("offset", "1");
  await expect(stops.nth(2)).toHaveAttribute("stop-color", "#36c5f0");

  // The third badge repeats a single color. That is the solid case: no gradient
  // is defined for it and the trail is stroked with the color itself, so a
  // caller holding one brand color can pass a pair without branching.
  const repeated = page.locator('[data-testid="animated-border"]').nth(2);
  await expect(repeated.locator("linearGradient")).toHaveCount(0);
  await expect(
    repeated.locator('rect[stroke="#a84f45"]').first(),
  ).toBeAttached();

  // Ids are per-instance, so several gradient borders on one screen cannot
  // collide and steal each other's colors.
  const ids = await page
    .locator("linearGradient")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
});
