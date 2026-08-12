import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Pointer and keyboard editing on the timeline.
 *
 * The maths is unit tested (`timelineEdits`, `timelineSelection`); what can
 * only be checked in a browser is the plumbing — that a capture-phase pointer
 * drag reaches the right resolver, that the live preview matches what the drop
 * commits, and that a drag does not also fire the clip's press handler.
 *
 * The `Editing` story owns the clips in state and applies each reported edit
 * with `applyTimelineEdits`, so every assertion here is against the real
 * controlled round trip rather than an internal.
 */

const STORY = "/iframe.html?id=timeline-examples--editing&viewMode=story";

/** The timecode range a clip publishes in its accessible name. */
async function clipRange(page: Page, clipId: string): Promise<string> {
  const label = await page
    .getByTestId(`timeline-clip-${clipId}`)
    .getAttribute("aria-label");
  return label ?? "";
}

async function dragBy(
  page: Page,
  from: Locator,
  offsetX: number,
  offsetY = 0,
  grip: "end" | "middle" | "start" = "middle",
) {
  const box = await from.boundingBox();
  expect(box).not.toBeNull();
  const x = (() => {
    if (grip === "start") {
      return (box?.x ?? 0) + 3;
    }
    if (grip === "end") {
      return (box?.x ?? 0) + (box?.width ?? 0) - 3;
    }
    return (box?.x ?? 0) + (box?.width ?? 0) / 2;
  })();
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + offsetX, y + offsetY, { steps: 10 });
  await page.mouse.up();
}

test("a clip drags along its track and reports the move", async ({ page }) => {
  await page.goto(STORY);
  const clip = page.getByTestId("timeline-clip-shot-interview");
  const before = await clip.boundingBox();
  const beforeLabel = await clipRange(page, "shot-interview");

  await dragBy(page, clip, 72);

  const after = await page
    .getByTestId("timeline-clip-shot-interview")
    .boundingBox();
  expect(after?.x ?? 0).toBeGreaterThan((before?.x ?? 0) + 40);
  // The move round-tripped through the consumer's state, so the clip's own
  // published timecode moved with it.
  expect(await clipRange(page, "shot-interview")).not.toEqual(beforeLabel);
});

test("a clip drags onto another track", async ({ page }) => {
  await page.goto(STORY);
  const clip = page.getByTestId("timeline-clip-title-open");
  const before = await clip.boundingBox();

  // One lane down: the Titles clip lands on Picture.
  await dragBy(page, clip, 0, (before?.height ?? 0) + 6);

  const after = await page
    .getByTestId("timeline-clip-title-open")
    .boundingBox();
  expect(after?.y ?? 0).toBeGreaterThan(before?.y ?? 0);
});

test("dragging an edge trims the clip instead of moving it", async ({
  page,
}) => {
  await page.goto(STORY);
  const clip = page.getByTestId("timeline-clip-shot-interview");
  const before = await clip.boundingBox();

  await dragBy(page, clip, -60, 0, "end");

  const after = await page
    .getByTestId("timeline-clip-shot-interview")
    .boundingBox();
  // The tail came in: the clip is shorter but still starts where it did.
  expect(after?.width ?? 0).toBeLessThan((before?.width ?? 0) - 30);
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(3);
});

test("the drag preview matches what the drop commits", async ({ page }) => {
  await page.goto(STORY);
  const clip = page.getByTestId("timeline-clip-shot-cutaway");
  const box = await clip.boundingBox();
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y, { steps: 10 });
  // Mid-drag the clip is already drawn where it will land.
  const during = await page
    .getByTestId("timeline-clip-shot-cutaway")
    .boundingBox();
  await page.mouse.up();

  const after = await page
    .getByTestId("timeline-clip-shot-cutaway")
    .boundingBox();
  expect(Math.abs((after?.x ?? 0) - (during?.x ?? 0))).toBeLessThan(2);
});

test("sweeping an empty lane marquee-selects the clips it crosses", async ({
  page,
}) => {
  await page.goto(STORY);
  const lanes = page.getByTestId("timeline-lanes");
  const box = await lanes.boundingBox();
  expect(box).not.toBeNull();

  // Start on an empty patch of the Titles lane (its only clip ends well before
  // this point), then sweep down and back across the lane stack. Both x offsets
  // stay inside the scroller's visible width.
  await page.mouse.move((box?.x ?? 0) + 400, (box?.y ?? 0) + 8);
  await page.mouse.down();
  await page.mouse.move(
    (box?.x ?? 0) + 200,
    (box?.y ?? 0) + (box?.height ?? 0) - 6,
    { steps: 14 },
  );
  await page.mouse.up();

  // Several clips now report themselves as selected in their accessible names.
  const selected = page.locator('[aria-label*="selected"]');
  expect(await selected.count()).toBeGreaterThan(2);
});

test("the razor splits the clip under the pointer", async ({ page }) => {
  await page.goto(STORY);
  await page.getByTestId("timeline-tool-razor").click();

  const clip = page.getByTestId("timeline-clip-shot-harbour");
  const box = await clip.boundingBox();
  await page.mouse.click(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );

  // The cut leaves the original id on the left half and adds a right half.
  await expect(page.getByTestId("timeline-clip-shot-harbour")).toBeVisible();
  await expect(page.getByTestId("timeline-clip-shot-harbour-2")).toBeVisible();
  const left = await page
    .getByTestId("timeline-clip-shot-harbour")
    .boundingBox();
  const right = await page
    .getByTestId("timeline-clip-shot-harbour-2")
    .boundingBox();
  expect(right?.x ?? 0).toBeGreaterThan(left?.x ?? 0);
});

test("a locked clip refuses to move", async ({ page }) => {
  await page.goto(STORY);
  const clip = page.getByTestId("timeline-clip-music-bed");
  const before = await clip.boundingBox();

  await dragBy(page, clip, 120);

  const after = await page.getByTestId("timeline-clip-music-bed").boundingBox();
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(2);
});

test("the ruler seeks by click and by keyboard", async ({ page }) => {
  await page.goto(STORY);
  const ruler = page.getByTestId("timeline-ruler");

  await ruler.click({ position: { x: 240, y: 12 } });
  const clicked = await ruler.getAttribute("aria-valuenow");
  expect(Number(clicked)).toBeGreaterThan(0);

  // The slider publishes whole frames, so one arrow press is one frame.
  await ruler.focus();
  await page.keyboard.press("ArrowRight");
  expect(Number(await ruler.getAttribute("aria-valuenow"))).toEqual(
    Number(clicked) + 1,
  );

  await page.keyboard.press("Home");
  expect(await ruler.getAttribute("aria-valuenow")).toEqual("0");
});

test("clips are one tab stop with arrow-key roving focus", async ({ page }) => {
  await page.goto(STORY);
  const first = page.getByTestId("timeline-clip-title-open");
  await first.focus();
  await expect(first).toBeFocused();

  // Down moves to the nearest clip on the next lane, not to the next tab stop.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("timeline-clip-shot-harbour")).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("timeline-clip-shot-interview")).toBeFocused();
});
