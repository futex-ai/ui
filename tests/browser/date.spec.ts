/**
 * Browser coverage for where the web calendar popover opens around its field.
 * Placement comes from the laid-out trigger and viewport, which the geometry
 * unit tests cannot see, so these checks drive the Date placement story: one
 * field near the top edge, and one 200px above the bottom edge — room for a
 * scrolling menu, but not for a whole month.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

import { CALENDAR_POPOVER_HEIGHT } from "../../src/date/calendarPopoverPlacement";

const storyReadyTimeout = 30_000;

/** The portal surface's viewport box and how much of the month is hidden. */
type SurfaceBox = {
  bottom: number;
  /** Content pixels clipped by the surface or scrolled out of view. */
  hidden: number;
  left: number;
  right: number;
  top: number;
};

async function openCalendar(page: Page, label: string) {
  await page.goto(
    "/iframe.html?id=date-examples--calendar-bottom-edge-flip&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: label });
  await expect(input).toBeVisible({ timeout: storyReadyTimeout });
  await input.click();
  const dialog = page.getByRole("dialog", { name: label });
  await expect(dialog.getByText("March 2026")).toBeVisible();
  return { dialog, input };
}

async function surfaceBox(dialog: Locator): Promise<SurfaceBox> {
  return dialog.evaluate((element) => {
    const surface = element.parentElement;
    const scroller = element.firstElementChild;
    if (!surface || !scroller) {
      throw new Error("calendar dialog is missing its surface or scroller");
    }
    const rect = surface.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      hidden:
        surface.scrollHeight -
        surface.clientHeight +
        (scroller.scrollHeight - scroller.clientHeight),
      left: rect.left,
      right: rect.right,
      top: rect.top,
    };
  });
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box ?? { height: 0, width: 0, x: 0, y: 0 };
}

async function bottomOf(locator: Locator) {
  const box = await boxOf(locator);
  return box.y + box.height;
}

test("calendar flips above a field too close to the bottom edge for a month", async ({
  page,
}) => {
  const { dialog, input } = await openCalendar(page, "Flips above");
  const field = await boxOf(input);

  // March 2026 spans six week rows. The 200px below the field would satisfy a
  // scrolling menu's threshold, but the calendar needs its whole height, so it
  // opens above the field, fully on screen, with nothing hidden.
  const above = await surfaceBox(dialog);
  expect(above.bottom).toBeLessThanOrEqual(field.y);
  expect(field.y - above.bottom).toBeLessThan(20);
  expect(above.top).toBeGreaterThanOrEqual(0);
  expect(above.hidden).toBe(0);

  // Paging to a shorter month keeps the popover on the same side, still
  // hugging the field rather than jumping below it.
  await dialog.getByRole("button", { name: "Previous month" }).click();
  await expect(dialog.getByText("February 2026")).toBeVisible();
  const paged = await surfaceBox(dialog);
  expect(paged.bottom).toBeCloseTo(above.bottom, 0);
  expect(paged.hidden).toBe(0);

  // A day on the last week row is on screen and pickable.
  await dialog.getByRole("button", { name: "Next month" }).click();
  const lastWeekDay = dialog.getByRole("button", { name: "30 Mar 2026" });
  expect(await bottomOf(lastWeekDay)).toBeLessThanOrEqual(above.bottom);
  await lastWeekDay.click();
  await expect(input).toHaveValue("30 Mar 2026");
  await expect(dialog).toBeHidden();
});

test("calendar opens below a field with room for a whole month", async ({
  page,
}) => {
  const { dialog, input } = await openCalendar(page, "Opens below");
  const field = await boxOf(input);

  const below = await surfaceBox(dialog);
  expect(below.top).toBeGreaterThanOrEqual(field.y + field.height);
  expect(below.hidden).toBe(0);

  // March 2026 is a six-week month, the calendar's tallest layout, so the
  // height placement reserves must cover it without overshooting by more
  // than its few pixels of headroom for taller fallback faces.
  const headroom = CALENDAR_POPOVER_HEIGHT - (below.bottom - below.top);
  expect(headroom).toBeGreaterThanOrEqual(0);
  expect(headroom).toBeLessThanOrEqual(8);
});

test("calendar scrolls inside the popover when neither side fits a month", async ({
  page,
}) => {
  await page.setViewportSize({ height: 460, width: 900 });
  const { dialog, input } = await openCalendar(page, "Flips above");
  const field = await boxOf(input);

  // Neither side of the field has room for six week rows, so the popover opens
  // on the roomier side, clamped to the viewport, with the last row out of view.
  const clamped = await surfaceBox(dialog);
  expect(clamped.bottom).toBeLessThanOrEqual(field.y);
  expect(clamped.top).toBeGreaterThanOrEqual(0);
  expect(clamped.hidden).toBeGreaterThan(0);
  const lastWeekDay = dialog.getByRole("button", { name: "30 Mar 2026" });
  expect(await bottomOf(lastWeekDay)).toBeGreaterThan(clamped.bottom);

  // Wheeling over the month scrolls it inside the popover, bringing the last
  // week row into view where it can be picked.
  await page.mouse.move(
    (clamped.left + clamped.right) / 2,
    (clamped.top + clamped.bottom) / 2,
  );
  await page.mouse.wheel(0, CALENDAR_POPOVER_HEIGHT);
  await expect
    .poll(() => bottomOf(lastWeekDay))
    .toBeLessThanOrEqual(clamped.bottom);
  await lastWeekDay.click();
  await expect(input).toHaveValue("30 Mar 2026");
});
