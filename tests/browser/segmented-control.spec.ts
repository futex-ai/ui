/**
 * Browser coverage for the segmented control: choices, keyboard checking,
 * accessible names, and the sliding thumb.
 */
import { expect, test } from "@playwright/test";

test("segmented control toggles report and source choices", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  await expect(
    page.getByRole("radio", { name: "Profit & loss" }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "Balance sheet" }).click();
  await expect(
    page.getByRole("radio", { name: "Balance sheet" }),
  ).toBeChecked();

  await expect(page.getByRole("radio", { name: "Combined" })).toBeChecked();
  await page.getByRole("radio", { name: "Consulting" }).click();
  await expect(page.getByRole("radio", { name: "Consulting" })).toBeChecked();

  // The outline (filter-pill) variant keeps its instant per-cell selection — it
  // draws no sliding thumb.
  await expect(
    page
      .getByRole("radiogroup", { name: "Income source" })
      .getByTestId("segmentedThumb"),
  ).toHaveCount(0);
});

test("segmented control checks the focused segment with Space and Enter", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  const profitLoss = page.getByRole("radio", { name: "Profit & loss" });
  const balanceSheet = page.getByRole("radio", { name: "Balance sheet" });
  await expect(profitLoss).toBeChecked();

  // Arrow keys move the roving tab stop; Space then checks the focused segment,
  // as the radio-group pattern requires. React Native Web's press responder
  // binds Spacebar to `button` roles only, so a `radio` has to press itself —
  // and must swallow the key so it does not scroll the page instead.
  await profitLoss.focus();
  await page.keyboard.press("ArrowRight");
  await expect(balanceSheet).toBeFocused();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("Space");
  await expect(balanceSheet).toBeChecked();
  await expect(profitLoss).not.toBeChecked();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  // Enter checks too, exactly once — the responder presses it on every role, so
  // the segment must not claim Enter as well or `onChange` would fire twice.
  await page.keyboard.press("ArrowLeft");
  await expect(profitLoss).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(profitLoss).toBeChecked();
  await expect(balanceSheet).not.toBeChecked();
});

test("segmented control disambiguates duplicate labels by name", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--duplicate-labels");

  const start = page.getByRole("radio", { name: "Custom start date" });
  const end = page.getByRole("radio", { name: "Custom end date" });
  const auto = page.getByRole("radio", { exact: true, name: "Auto" });
  await expect(auto).toBeChecked();
  await start.click();
  await expect(start).toBeChecked();
  await expect(end).not.toBeChecked();
  await end.click();
  await expect(end).toBeChecked();
  await expect(start).not.toBeChecked();
});

test("segmented pill thumb slides over the selected tab and resizes to it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--animated-tabs");

  const group = page.getByRole("radiogroup", {
    exact: true,
    name: "Calendar view",
  });
  const thumb = group.getByTestId("segmentedThumb");
  const day = group.getByRole("radio", { name: "Day" });
  const quarter = group.getByRole("radio", { name: "Quarter" });

  // The thumb is a single raised surface that glides — it carries a real
  // left/width CSS transition rather than snapping.
  await expect(thumb).toHaveCSS("transition-property", /left|width/);

  // At rest it overlays the selected pill (sub-pixel: allow a 2px tolerance).
  const near = (a?: number, b?: number, tol = 2) =>
    a !== undefined && b !== undefined && Math.abs(a - b) <= tol;
  const dayBox = await day.boundingBox();
  await expect
    .poll(async () => near((await thumb.boundingBox())?.x, dayBox?.x))
    .toBe(true);

  // Switching tabs moves the thumb to — and resizes it to fit — "Quarter",
  // which is wider than "Day".
  await quarter.click();
  const quarterBox = await quarter.boundingBox();
  await expect
    .poll(async () => {
      const box = await thumb.boundingBox();
      return near(box?.x, quarterBox?.x) && near(box?.width, quarterBox?.width);
    })
    .toBe(true);
  expect(quarterBox?.width ?? 0).toBeGreaterThan(dayBox?.width ?? 0);
});

test("segmented animated={false} snaps the thumb without a slide transition", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--animated-tabs");

  const group = page.getByRole("radiogroup", {
    exact: true,
    name: "Static calendar view",
  });
  const thumb = group.getByTestId("segmentedThumb");

  // No left/width transition — the thumb is placed, not animated.
  await expect(thumb).not.toHaveCSS("transition-property", /left|width/);

  // It still tracks selection: one frame after the click it is already over the
  // newly selected pill (no mid-slide), confirming the thumb snaps.
  const quarter = group.getByRole("radio", { name: "Quarter" });
  await quarter.click();
  const quarterBox = await quarter.boundingBox();
  await expect
    .poll(
      async () => {
        const box = await thumb.boundingBox();
        return Math.abs((box?.x ?? 0) - (quarterBox?.x ?? 0)) <= 2;
      },
      { timeout: 1000 },
    )
    .toBe(true);
});
