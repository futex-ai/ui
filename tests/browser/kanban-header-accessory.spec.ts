/** Browser coverage for the kanban column header accessory. */
import { expect, test } from "@playwright/test";

test("kanban renders a header accessory per column, before the add button", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  // The render prop runs per column: a toggle on the first two, `null` on the
  // terminal one.
  await expect(
    board.getByRole("switch", { name: "Agent for Drafted" }),
  ).toBeVisible();
  await expect(
    board.getByRole("switch", { name: "Agent for Approved" }),
  ).toBeVisible();
  await expect(
    board.getByRole("switch", { name: "Agent for Published" }),
  ).toHaveCount(0);

  // The accessory column's header is chip, count, accessory, add button — in
  // that order — and the accessory is pushed to the trailing edge rather than
  // sitting against the count.
  const header = await board
    .getByTestId("kanban-column-drafted")
    .evaluate((column) => {
      const row = column.firstElementChild as HTMLElement;
      return Array.from(row.children).map((node) => ({
        hasSwitch: Boolean(node.querySelector('[role="switch"]')),
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
        role: node.getAttribute("role"),
        text: node.textContent,
      }));
    });
  expect(header).toHaveLength(4);
  expect(header[0].text).toBe("Drafted");
  expect(header[1].text).toBe("2");
  expect(header[2].hasSwitch).toBe(true);
  expect(header[3].role).toBe("button");
  expect(header[2].left).toBeGreaterThan(header[1].right + 20);
});

test("kanban column with no accessory keeps its original header nodes", async ({
  page,
}) => {
  const headerChildren = (testID: string) =>
    page
      .getByTestId(testID)
      .first()
      .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);

  // A board that never passes the prop: chip + count + add button.
  await page.goto("/iframe.html?id=kanban-examples--add-and-empty");
  const baselineWithAdd = await headerChildren("kanban-column-published");
  expect(baselineWithAdd).toBe(3);
  // And with no add button either: chip + count.
  await page.goto("/iframe.html?id=kanban-examples--grouped-by-status");
  const baselinePlain = await headerChildren("kanban-column-published");
  expect(baselinePlain).toBe(2);

  // A column whose `renderColumnAccessory` returns `null` adds no header node,
  // with or without the add button.
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");
  const withAdd = await page
    .getByRole("group", { name: "Content board" })
    .getByTestId("kanban-column-published")
    .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);
  expect(withAdd).toBe(baselineWithAdd);
  const plain = await page
    .getByRole("group", { name: "Agent board (md)" })
    .getByTestId("kanban-column-published")
    .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);
  expect(plain).toBe(baselinePlain);
});

test("kanban header accessory never changes the header height", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  // The slot is capped at the header's content box and clips, so an accessory
  // cannot stretch the header; it also never shrinks under a narrow column.
  const slot = await page
    .getByRole("group", { name: "Content board" })
    .getByTestId("kanban-column-drafted")
    .evaluate((column) => {
      const node = (column.firstElementChild as HTMLElement)
        .children[2] as HTMLElement;
      const style = getComputedStyle(node);
      return {
        flexShrink: style.flexShrink,
        maxHeight: style.maxHeight,
        overflow: style.overflow,
      };
    });
  expect(slot).toEqual({
    flexShrink: "0",
    maxHeight: "20px",
    overflow: "hidden",
  });

  // At every size, the accessory column's header is exactly as tall as the
  // header of a column that renders no accessory.
  for (const size of ["sm", "md", "lg"] as const) {
    const board = page.getByRole("group", { name: `Agent board (${size})` });
    const heights = await Promise.all(
      ["drafted", "published"].map((id) =>
        board
          .getByTestId(`kanban-column-${id}`)
          .evaluate(
            (column) =>
              column.firstElementChild?.getBoundingClientRect().height ?? -1,
          ),
      ),
    );
    expect(heights[0]).toBeCloseTo(heights[1], 1);
  }
});

test("kanban header accessory is inert to the board's press and drag", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const toggle = board.getByRole("switch", { name: "Agent for Drafted" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();

  // The accessory owns its own state; the click never reached a card handler,
  // started a drag, or tripped the post-drag press suppression.
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);

  // A card press still works right after, so nothing was left suppressed.
  await board.getByTestId("kanban-card-c1").click();
  await expect(page.getByText("Opened c1")).toBeVisible();
});

test("kanban header accessory is a keyboard-operable tab stop with a visible ring", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const toggle = board.getByRole("switch", { name: "Agent for Drafted" });

  // A focusable accessory sits in the natural DOM order: after the count and
  // before the add button, so Tab reaches the add button next.
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    board.getByRole("button", { name: "Add card to Drafted" }),
  ).toBeFocused();

  // The slot clips, so an accessory needs an inset indicator — the browser's
  // outset outline would be cropped away (WCAG 2.1 — 2.4.7).
  await toggle.focus();
  const focusStyle = await toggle.evaluate((node) => {
    const style = getComputedStyle(node);
    return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
  });
  expect(focusStyle.boxShadow).toContain("inset");
  expect(focusStyle.outlineStyle).toBe("none");

  // The accessory brings its own keyboard handling: the web backend presses
  // Enter for any role but binds Space to `button` roles only, so a `switch`
  // has to wire Space itself. Both must toggle exactly once.
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  // Keyboard use of the accessory never reaches the board either.
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
});

test("kanban a pointer drag from the accessory never grabs a card", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const box = await board
    .getByRole("switch", { name: "Agent for Drafted" })
    .boundingBox();
  expect(box).not.toBeNull();

  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 200, { steps: 12 });

  // The header is outside the board's card geometry, so no card is picked up.
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);
  await expect(page.getByTestId("kanban-drop-preview")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
});
