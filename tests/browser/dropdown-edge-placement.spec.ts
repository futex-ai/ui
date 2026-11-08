/**
 * Browser coverage for dropdown placement against the viewport edges and while
 * the page scrolls.
 */
import { expect, test, type Page } from "@playwright/test";

test("open dropdown surface follows the trigger when the page scrolls", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--selector-scroll-tracking",
  );

  const trigger = page.getByRole("button", { name: "Scroll field, Standard" });
  await trigger.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // The menu opens a fixed gutter below the trigger.
  const before = await triggerSurfaceAlignment(trigger, listbox);
  expect(before.gap).toBeGreaterThanOrEqual(0);
  expect(before.gap).toBeLessThan(30);

  // Scroll the page while the menu is open. The web surface lives in a
  // `position: fixed` portal; without re-measuring on scroll it would stay
  // pinned to its stale viewport coordinates and detach from the moved trigger.
  await page.evaluate(() => window.scrollTo(0, 320));

  // The surface re-measures on the next frame and keeps the same offset from
  // the trigger, so the menu stays anchored as the page scrolls.
  await expect
    .poll(async () => {
      const now = await triggerSurfaceAlignment(trigger, listbox);
      return Math.abs(now.gap - before.gap);
    })
    .toBeLessThanOrEqual(2);

  // The trigger genuinely scrolled up, so the gap-stability check above is a
  // real test of tracking rather than a no-op.
  const after = await triggerSurfaceAlignment(trigger, listbox);
  expect(before.triggerTop - after.triggerTop).toBeGreaterThan(100);
});

async function triggerSurfaceAlignment(
  trigger: ReturnType<Page["getByRole"]>,
  surface: ReturnType<Page["getByRole"]>,
) {
  const triggerBox = await trigger.boundingBox();
  const surfaceBox = await surface.boundingBox();
  if (!triggerBox || !surfaceBox) {
    return { gap: Number.NaN, triggerTop: Number.NaN };
  }
  return {
    gap: surfaceBox.y - (triggerBox.y + triggerBox.height),
    triggerTop: triggerBox.y,
  };
}

test("dropdown placement flips above the trigger near the bottom edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--bottom-edge-flip");

  // The selector pinned to the bottom of the viewport has no room below, so the
  // long menu opens upward: its rows sit above the trigger.
  const bottomTrigger = page.getByRole("button", {
    name: "Flips above, Long option 01",
  });
  await bottomTrigger.click();
  const bottomTriggerBox = await bottomTrigger.boundingBox();
  const upwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(bottomTriggerBox).not.toBeNull();
  expect(upwardOption).not.toBeNull();
  expect(upwardOption?.y ?? 0).toBeLessThan(bottomTriggerBox?.y ?? 0);
  await page.keyboard.press("Escape");

  // The selector near the top has space below, so the same menu opens downward.
  const topTrigger = page.getByRole("button", {
    name: "Opens below, Long option 01",
  });
  await topTrigger.click();
  const topTriggerBox = await topTrigger.boundingBox();
  const downwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(topTriggerBox).not.toBeNull();
  expect(downwardOption).not.toBeNull();
  expect(downwardOption?.y ?? 0).toBeGreaterThan(topTriggerBox?.y ?? 0);
});

test("dropdown placement clamps a wide menu inside the side edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--horizontal-edge-clamp");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  // The right-edge menu is wider than its trigger, so it shifts left to stay
  // fully on screen rather than spilling past the right edge.
  const rightTrigger = page.getByRole("button", {
    name: "Open right edge menu",
  });
  await rightTrigger.click();
  const rightTriggerBox = await rightTrigger.boundingBox();
  const rightOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(rightTriggerBox).not.toBeNull();
  expect(rightOption).not.toBeNull();
  // Fully inside the right edge...
  expect((rightOption?.x ?? 0) + (rightOption?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
  // ...and shifted left of the trigger to make room.
  expect(rightOption?.x ?? 0).toBeLessThan(rightTriggerBox?.x ?? 0);
  await page.keyboard.press("Escape");

  // The left-edge menu stays pinned at the left margin (never off-screen).
  await page.getByRole("button", { name: "Open left edge menu" }).click();
  const leftOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(leftOption).not.toBeNull();
  expect(leftOption?.x ?? -1).toBeGreaterThanOrEqual(0);
});

test("dropdown placement end-aligns a wide menu to the trigger edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--end-aligned-menu");

  const trigger = page.getByRole("button", { name: "Open end aligned menu" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // The wide menu extends leftward from the trigger...
  expect(option?.x ?? 0).toBeLessThan(triggerBox?.x ?? 0);
  // ...while its right edge stays aligned to the trigger's right edge.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    (triggerBox?.x ?? 0) + (triggerBox?.width ?? 0) + 2,
  );
});

test("dropdown placement grid flips and stays on screen at the bottom corner", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--edge-placement-grid");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  const trigger = page.getByRole("button", { name: "Bottom right, Region 01" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("option", { exact: true, name: "Region 02" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // Flipped above the trigger near the bottom edge...
  expect(option?.y ?? 0).toBeLessThan(triggerBox?.y ?? 0);
  // ...and inside the right edge of the screen.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
});

test("placement playground reports the side resolved against the content edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--placement-playground");

  // Moving the trigger to the bottom of the content frame leaves no room below,
  // so the engine resolves an upward placement.
  await page
    .getByRole("button", { name: "Move trigger to bottom-right" })
    .click();
  await expect(page.getByText("Opens upward ↑")).toBeVisible();

  // Near the top there is room below, so it resolves a downward placement.
  await page.getByRole("button", { name: "Move trigger to top-left" }).click();
  await expect(page.getByText("Opens downward ↓")).toBeVisible();
});
