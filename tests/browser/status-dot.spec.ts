/** Browser coverage for status dots and the pulsing badge dot. */
import { expect, test } from "@playwright/test";

test("status dot sizes step 7 / 9 / 11 with md matching the workflow dot", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=status-dot-examples--sizes&viewMode=story");

  // `md` is 9px because that was the workflow graph's hard-coded dot: promoting
  // the component out of `workflow/` had to leave the graph pixel-identical.
  for (const [testId, diameter] of [
    ["statusDotSm", 7],
    ["statusDotMd", 9],
    ["statusDotLg", 11],
  ] as const) {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box?.width).toBeCloseTo(diameter, 0);
    expect(box?.height).toBeCloseTo(diameter, 0);
  }
  // The testID lands on the dot-sized layout box; the visible circle is the fill
  // inside it, in the default theme's mid `primary` accent (#4f7864).
  const fill = page.getByTestId("statusDotMd").locator("> div").first();
  await expect(fill).toHaveCSS("background-color", "rgb(79, 120, 100)");
  await expect(fill).toHaveCSS("border-radius", "999px");
});

test("a pulsing badge dot swells a halo without resizing the pill", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=badge-examples--pulsing-dot&viewMode=story");

  const running = page.getByText("Running", { exact: true });
  const queued = page.getByText("Queued", { exact: true });
  const pulsingPill = running.locator("xpath=..");
  const restingPill = queued.locator("xpath=..");

  // The halo is out of flow, so a live pill keeps a resting pill's height.
  const [pulsingBox, restingBox] = await Promise.all([
    pulsingPill.boundingBox(),
    restingPill.boundingBox(),
  ]);
  expect(pulsingBox?.height).toBeCloseTo(restingBox?.height ?? 0, 0);

  // The dot box is the pill's first child. A pulsing one holds the halo plus
  // the fill; a resting one holds only the fill — the ping is an extra element,
  // not a style, so the static case renders nothing extra at all.
  const pulsingDot = pulsingPill.locator("> div").first();
  const restingDot = restingPill.locator("> div").first();
  await expect(pulsingDot.locator("> div")).toHaveCount(2);
  await expect(restingDot.locator("> div")).toHaveCount(1);

  // The halo actually animates: its transform scale changes between frames, and
  // the dot's own fill never dims (that was the pre-mockup behaviour).
  const halo = pulsingDot.locator("> div").first();
  const scaleOf = async () =>
    await halo.evaluate((node) => getComputedStyle(node).transform);
  const first = await scaleOf();
  await expect.poll(scaleOf, { timeout: 4000 }).not.toBe(first);
  const fill = pulsingDot.locator("> div").nth(1);
  await expect(fill).not.toHaveAttribute("style", /opacity/);
});
