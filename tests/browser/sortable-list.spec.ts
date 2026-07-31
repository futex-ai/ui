import { expect, test, type Page } from "@playwright/test";

/**
 * Behavioural coverage for the SortableList drag engine. The unit suites only
 * assert the pure model and the component source, so these are the tests that
 * actually exercise a real pointer drag and a real keyboard reorder end to end
 * — the guard that the engine keeps working as it is generalised to N groups.
 */

const storyReadyTimeout = 30_000;

async function gotoSortableStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=sortablelist-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

/** The list's rows in flow order, read from the measurement testids. */
async function itemOrder(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="sortable-item-"]'))
      .map((node) => node.getAttribute("data-testid") ?? "")
      .map((id) => id.replace("sortable-item-", "")),
  );
}

/**
 * Drag `handleName`'s grab handle past one end of the list. Aiming past an end
 * rather than at a particular row keeps the assertion deterministic: the rows
 * reflow as the dragged one lifts out and as the preview opens a slot, so a
 * midpoint measured before the drag is already stale by the time it lands.
 */
async function dragHandlePast(
  page: Page,
  handleName: string,
  edge: "end" | "start",
) {
  const from = await page
    .getByRole("button", { name: handleName })
    .boundingBox();
  const list = await page
    .getByRole("list", { name: "Workflow statuses" })
    .boundingBox();
  if (!from || !list) {
    throw new Error("expected the handle and the list to be laid out");
  }
  const x = list.x + list.width / 2;
  const y = edge === "end" ? list.y + list.height - 4 : list.y + 4;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // Clear the 5px click-vs-drag threshold first, then sweep to the target end in
  // steps so the engine sees intermediate pointermove events.
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 12);
  await page.mouse.move(x, y, { steps: 12 });
  await page.mouse.up();
}

test("a pointer drag moves a row to the end of the list", async ({ page }) => {
  await gotoSortableStory(page, "with-handle");

  expect(await itemOrder(page)).toEqual([
    "todo",
    "in-progress",
    "in-review",
    "complete",
    "cancelled",
  ]);

  await dragHandlePast(page, "Reorder Todo", "end");

  await expect
    .poll(() => itemOrder(page))
    .toEqual(["in-progress", "in-review", "complete", "cancelled", "todo"]);
});

test("a pointer drag moves a row to the start of the list", async ({
  page,
}) => {
  await gotoSortableStory(page, "with-handle");

  await dragHandlePast(page, "Reorder Cancelled", "start");

  await expect
    .poll(() => itemOrder(page))
    .toEqual(["cancelled", "todo", "in-progress", "in-review", "complete"]);
});

test("a keyboard grab moves a row and announces its new position", async ({
  page,
}) => {
  await gotoSortableStory(page, "with-handle");

  const handle = page.getByRole("button", { name: "Reorder Todo" });
  await handle.focus();
  await page.keyboard.press(" ");

  // The grab is announced through the shared live region, naming the item.
  await expect(page.locator("#firna-ui-live-region-polite")).toContainText(
    "Grabbed Todo",
  );

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press(" ");

  await expect
    .poll(() => itemOrder(page))
    .toEqual(["in-progress", "in-review", "todo", "complete", "cancelled"]);
  await expect(page.locator("#firna-ui-live-region-polite")).toContainText(
    "Dropped",
  );
});

test("Escape abandons a keyboard grab without reordering", async ({ page }) => {
  await gotoSortableStory(page, "with-handle");

  const handle = page.getByRole("button", { name: "Reorder Todo" });
  await handle.focus();
  await page.keyboard.press(" ");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");

  await expect(page.locator("#firna-ui-live-region-polite")).toContainText(
    "Reorder cancelled",
  );
  expect(await itemOrder(page)).toEqual([
    "todo",
    "in-progress",
    "in-review",
    "complete",
    "cancelled",
  ]);
});

test("a row's own controls stay clickable beside the grab handle", async ({
  page,
}) => {
  await gotoSortableStory(page, "with-handle");

  // Handle mode exists so the row keeps its own interactive content; a click on
  // the row's down-chevron must still reorder through the consumer's callback.
  await page.getByRole("button", { name: "Move Todo down" }).click();

  await expect
    .poll(() => itemOrder(page))
    .toEqual(["in-progress", "todo", "in-review", "complete", "cancelled"]);
});

test("a horizontal list steps on its own axis", async ({ page }) => {
  await gotoSortableStory(page, "horizontal");

  // The engine reads each list's own orientation, so a horizontal list must
  // ignore Up / Down and step with Left / Right.
  await page.getByRole("button", { name: "Reorder Todo" }).focus();
  await page.keyboard.press(" ");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press(" ");

  await expect
    .poll(() => itemOrder(page))
    .toEqual(["in-progress", "todo", "in-review", "complete"]);
});

test("the drag ghost tracks the cursor inside a transformed ancestor", async ({
  page,
}) => {
  await gotoSortableStory(page, "with-handle");

  // A transformed ancestor becomes the containing block for `position: fixed`
  // descendants, so an inline ghost would resolve its viewport coordinates
  // against that box and drift by the box's offset. Offsetting the root as well
  // makes any such drift measurable.
  await page.evaluate(() => {
    const root = document.getElementById("storybook-root");
    if (!root) throw new Error("expected a storybook root");
    root.style.transform = "translate(0px, 0px)";
    root.style.marginLeft = "60px";
    root.style.marginTop = "80px";
  });

  const from = await page
    .getByRole("button", { name: "Reorder Todo" })
    .boundingBox();
  if (!from) {
    throw new Error("expected the handle to be laid out");
  }
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 12);
  await page.mouse.move(x + 4, y + 60, { steps: 6 });

  // The clone is pinned to the point it was picked up, so the cursor stays
  // inside it for the whole drag.
  const ghost = await page.getByTestId("sortable-drag-ghost").boundingBox();
  await page.mouse.up();
  if (!ghost) {
    throw new Error("expected the drag ghost to be rendered");
  }
  expect(ghost.x).toBeLessThanOrEqual(x + 4);
  expect(ghost.x + ghost.width).toBeGreaterThanOrEqual(x + 4);
  expect(ghost.y).toBeLessThanOrEqual(y + 60);
  expect(ghost.y + ghost.height).toBeGreaterThanOrEqual(y + 60);
});
