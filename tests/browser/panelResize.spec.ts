/**
 * Browser journeys of the panel resize handle. A real browser shows that a
 * drag follows the pointer off the handle, that every listener goes at the
 * end of a drag, and how keyboard focus paints the grip. The width rules
 * themselves are unit-tested in `tests/unit/panelResize.test.ts`.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

import { DEFAULT_GLOW, expectNoIndicator } from "./focusRingHelpers";

async function gotoPanelStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=panel-resize-examples--${storyId}&viewMode=story`,
  );
}

/** Presses the pointer on the middle of a handle and returns that point. */
async function pressHandle(page: Page, handle: Locator) {
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { x, y };
}

const bodyCursor = (page: Page) =>
  page.evaluate(() => document.body.style.cursor);

/**
 * The capture listeners for pointer move, up, and cancel on the document: a
 * drag adds exactly these three and must remove them at its end. The page has
 * none of them at rest. The browser's own listener registry is the only place
 * a leaked listener shows, because a leaked listener of an ended drag does
 * nothing visible.
 */
async function dragListeners(page: Page) {
  const client = await page.context().newCDPSession(page);
  const { result } = await client.send("Runtime.evaluate", {
    expression: "document",
  });
  const { listeners } = await client.send("DOMDebugger.getEventListeners", {
    objectId: result.objectId ?? "",
  });
  await client.detach();
  return listeners.filter(
    (listener) =>
      listener.useCapture &&
      ["pointercancel", "pointermove", "pointerup"].includes(listener.type),
  ).length;
}

test("a drag follows the pointer off the handle, stays in bounds, and stores the width once", async ({
  page,
}) => {
  await gotoPanelStory(page, "panels");
  const sidebar = page.getByRole("separator", { name: "Resize project list" });
  const changes = page.getByRole("separator", {
    name: "Resize changes panel",
  });
  const widths = page.getByText(/^Project list: \d+ px · Changes: \d+ px$/);
  const saves = page.getByText(/^Proposals: \d+ · Saves: \d+ · Last saved: /);
  const selection = page.getByText(/^(Selected files: \d+|Selecting files)$/);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "232");
  await expect(sidebar).toHaveAttribute("aria-valuetext", "232 pixels");
  await expect(sidebar).toHaveAttribute("aria-valuemin", "200");
  await expect(sidebar).toHaveAttribute("aria-valuemax", "360");
  await expect(sidebar).toHaveAttribute("aria-orientation", "vertical");

  // Far past the end edge, the width stops at the maximum; far back, at the
  // minimum. The drag keeps the resize cursor off the handle, and it starts
  // no drag selection over the files and selects no text on its way.
  const start = await pressHandle(page, sidebar);
  await page.mouse.move(start.x + 40, start.y + 60);
  await expect(widths).toHaveText("Project list: 272 px · Changes: 340 px");
  expect(await bodyCursor(page)).toBe("col-resize");
  expect(await dragListeners(page)).toBe(3);
  await expect(selection).toHaveText("Selected files: 0");
  await page.mouse.move(start.x + 400, start.y);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "360");
  await page.mouse.move(start.x - 300, start.y);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "200");
  await page.mouse.up();
  await expect(saves).toHaveText(
    /^Proposals: \d+ · Saves: 1 · Last saved: Project list 200$/,
  );
  expect(await bodyCursor(page)).toBe("");
  expect(await dragListeners(page)).toBe(0);
  await expect(selection).toHaveText("Selected files: 0");
  expect(await page.evaluate(() => String(window.getSelection()))).toBe("");

  // After the release, the pointer no longer moves the handle.
  await page.mouse.move(start.x + 100, start.y);
  await expect(widths).toHaveText("Project list: 200 px · Changes: 340 px");

  // On the start edge, moving away from the panel, to the left, widens it.
  const second = await pressHandle(page, changes);
  await page.mouse.move(second.x - 60, second.y);
  await expect(changes).toHaveAttribute("aria-valuenow", "400");
  await page.mouse.up();
  await expect(saves).toHaveText(
    /^Proposals: \d+ · Saves: 2 · Last saved: Changes 400$/,
  );
});

test("keys move a handle one step in their direction and Home and End reach the bounds", async ({
  page,
}) => {
  await gotoPanelStory(page, "panels");
  const sidebar = page.getByRole("separator", { name: "Resize project list" });
  const changes = page.getByRole("separator", {
    name: "Resize changes panel",
  });
  const saves = page.getByText(/^Proposals: \d+ · Saves: \d+ · Last saved: /);

  await sidebar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(sidebar).toHaveAttribute("aria-valuenow", "248");
  await page.keyboard.press("ArrowLeft");
  await expect(sidebar).toHaveAttribute("aria-valuenow", "232");
  await page.keyboard.press("End");
  await expect(sidebar).toHaveAttribute("aria-valuenow", "360");
  await page.keyboard.press("Home");
  await expect(sidebar).toHaveAttribute("aria-valuenow", "200");
  await expect(saves).toHaveText(
    "Proposals: 4 · Saves: 4 · Last saved: Project list 200",
  );
  // At a bound a key changes nothing and stores nothing.
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowLeft");
  await expect(saves).toHaveText(
    "Proposals: 4 · Saves: 4 · Last saved: Project list 200",
  );

  // On the start edge, Left moves the handle away from the panel.
  await changes.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(changes).toHaveAttribute("aria-valuenow", "356");
  await expect(saves).toHaveText(
    "Proposals: 5 · Saves: 5 · Last saved: Changes 356",
  );
});

test("a cancelled, disabled, or removed drag lets go of the pointer", async ({
  page,
}) => {
  await gotoPanelStory(page, "panels");
  const sidebar = page.getByRole("separator", { name: "Resize project list" });
  const widths = page.getByText(/^Project list: \d+ px · Changes: \d+ px$/);
  const saves = page.getByText(/^Proposals: \d+ · Saves: \d+ · Last saved: /);

  // A cancelled pointer ends the drag and stores the last width.
  let start = await pressHandle(page, sidebar);
  await page.mouse.move(start.x + 20, start.y);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "252");
  // A user cannot cancel a pointer on purpose, so the test sends the event.
  await page.evaluate(() =>
    document.dispatchEvent(new PointerEvent("pointercancel")),
  );
  await expect(saves).toHaveText(/Saves: 1 · Last saved: Project list 252$/);
  expect(await dragListeners(page)).toBe(0);
  await page.mouse.move(start.x + 60, start.y);
  await expect(widths).toHaveText("Project list: 252 px · Changes: 340 px");
  await page.mouse.up();

  // Turning the handle off ends the drag as a release does. The test presses
  // the switch from script, because the pointer is busy with the drag.
  start = await pressHandle(page, sidebar);
  await page.mouse.move(start.x + 20, start.y);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "272");
  await page
    .getByRole("switch", { name: "Lock panels" })
    .dispatchEvent("click");
  await expect(saves).toHaveText(/Saves: 2 · Last saved: Project list 272$/);
  expect(await dragListeners(page)).toBe(0);
  await page.mouse.move(start.x + 60, start.y);
  await page.mouse.up();
  await expect(sidebar).toHaveAttribute("aria-valuenow", "272");
  await expect(sidebar).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("switch", { name: "Lock panels" }).click();

  // Removing the panel mid-drag drops the drag without storing a width.
  start = await pressHandle(page, sidebar);
  await page.mouse.move(start.x + 20, start.y);
  await expect(sidebar).toHaveAttribute("aria-valuenow", "292");
  await page
    .getByRole("button", { name: "Hide project list" })
    .dispatchEvent("click");
  await expect(sidebar).toBeHidden();
  expect(await bodyCursor(page)).toBe("");
  expect(await dragListeners(page)).toBe(0);
  await page.mouse.move(start.x + 60, start.y);
  await page.mouse.up();
  await expect(widths).toHaveText("Project list: 292 px · Changes: 340 px");
  await expect(saves).toHaveText(/Saves: 2 · Last saved: Project list 272$/);
});

test("keyboard focus shows the grip with the shared glow, a pointer does not, and none shows nothing", async ({
  page,
}) => {
  await gotoPanelStory(page, "panels");
  const sidebar = page.getByRole("separator", { name: "Resize project list" });
  const grip = sidebar.locator("> [data-firna-focus-ring]");

  await expect(grip).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Hide project list" }).focus();
  await page.keyboard.press("Tab");
  await expect(sidebar).toBeFocused();
  await expect(grip).toHaveCSS("opacity", "1");
  expect(
    await grip.evaluate((node) => getComputedStyle(node).boxShadow),
  ).toContain(DEFAULT_GLOW);

  // A pointer press focuses the handle without the glow.
  await page.mouse.click(5, 5);
  const box = await sidebar.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(sidebar).toBeFocused();
  await expect(grip).toHaveCSS("box-shadow", "none");

  // With no focus indicator, keyboard focus shows neither the grip nor a ring.
  await gotoPanelStory(page, "handle-states");
  const plain = page.getByRole("separator", {
    name: "Resize panel without a focus indicator",
  });
  await page
    .getByRole("separator", { name: "Resize keyboard focus panel" })
    .focus();
  await page.keyboard.press("Tab");
  await expect(plain).toBeFocused();
  const plainGrip = plain.locator("> [data-firna-focus-none]");
  await expect(plainGrip).toHaveCSS("opacity", "0");
  await expectNoIndicator(plain, plainGrip);
});
