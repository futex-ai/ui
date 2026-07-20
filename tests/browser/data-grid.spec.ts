import { expect, test, type Page } from "@playwright/test";

// Clipboard access for the copy/paste test (harmless for the others).
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const storyReadyTimeout = 30_000;

async function gotoDataGridStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=datagrid-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

test("data grid renders typed columns, pills, dates, and a footer", async ({
  page,
}) => {
  await gotoDataGridStory(page, "basic");

  await expect(page.getByRole("grid", { name: "Content" })).toBeVisible({
    timeout: storyReadyTimeout,
  });
  await expect(page.getByRole("columnheader")).toHaveCount(7);

  // Typed cell content: a single-select pill, a right-aligned number, a tag
  // pill, and a formatted date.
  await expect(page.getByText("Drafted").first()).toBeVisible();
  await expect(page.getByText("twitter/x").first()).toBeVisible();
  await expect(page.getByText("0.81").first()).toBeVisible();
  await expect(page.getByText("29 Jun 2026").first()).toBeVisible();
  await expect(page.getByText("7 of 128 records")).toBeVisible();
});

test("data grid selects a cell on click and moves the active cell with arrows", async ({
  page,
}) => {
  await gotoDataGridStory(page, "selection");

  const status = page.getByTestId("selection-status");
  await page.getByText("Why we moved every workflow").click();
  await expect(status).toHaveText("1 cell selected");
  await expect(
    page.locator('[role="gridcell"][aria-selected="true"]'),
  ).toHaveCount(1);

  // Arrow keys move the single active cell (still one selected) and keep DOM
  // focus on a grid cell so the next key is handled.
  await page.keyboard.press("ArrowRight");
  await expect(status).toHaveText("1 cell selected");
  const focusedRole = await page.evaluate(() =>
    document.activeElement?.getAttribute("role"),
  );
  expect(focusedRole).toBe("gridcell");
});

test("shift+arrow extends a rectangular selection and Ctrl+A selects all", async ({
  page,
}) => {
  await gotoDataGridStory(page, "selection");

  const status = page.getByTestId("selection-status");
  const selectedCount = () =>
    page.locator('[role="gridcell"][aria-selected="true"]').count();

  await page.getByText("Why we moved every workflow").click();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(status).toHaveText("2 cells selected");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(status).toHaveText("4 cells selected");
  await expect.poll(selectedCount).toBe(4);

  await page.keyboard.press("Control+a");
  await expect(status).toHaveText("49 cells selected");
  await expect.poll(selectedCount).toBe(49);
});

test("pointer drag paints a rectangular cell range", async ({ page }) => {
  await gotoDataGridStory(page, "selection");

  const status = page.getByTestId("selection-status");
  const start = await page
    .getByText("Why we moved every workflow")
    .boundingBox();
  // r4 "Score" cell — three rows down, two columns across from the start.
  const end = await page.getByText("0.55").first().boundingBox();
  if (!start || !end) {
    throw new Error("grid cells not found");
  }

  await page.mouse.move(start.x + 20, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 10,
  });
  // The range updates live during the drag (3 rows × 3 columns = 9 cells) and a
  // marquee box is drawn over the selection.
  await expect(status).toHaveText("9 cells selected");
  await expect(
    page.locator('[role="gridcell"][aria-selected="true"]'),
  ).toHaveCount(9);
  await expect(page.getByTestId("data-grid-marquee")).toBeVisible();
  await page.mouse.up();
  await expect(status).toHaveText("9 cells selected");
  await expect(page.getByTestId("data-grid-marquee")).toHaveCount(0);
});

test("gutter drag selects whole rows (no marquee)", async ({ page }) => {
  await gotoDataGridStory(page, "selection");
  const status = page.getByTestId("selection-status");

  const g2 = await page.getByText("2", { exact: true }).first().boundingBox();
  const g4 = await page.getByText("4", { exact: true }).first().boundingBox();
  if (!g2 || !g4) {
    throw new Error("gutter cells not found");
  }
  await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
  await page.mouse.down();
  await page.mouse.move(g4.x + g4.width / 2, g4.y + g4.height / 2, {
    steps: 6,
  });
  // Rows 2–4 × 7 columns = 21 cells, and no marquee box for a row drag.
  await expect(status).toHaveText("21 cells selected");
  await expect(page.getByTestId("data-grid-marquee")).toHaveCount(0);
  await page.mouse.up();
});

test("header drag selects whole columns", async ({ page }) => {
  await gotoDataGridStory(page, "full-featured");

  const status = page.getByRole("columnheader").filter({ hasText: "Status" });
  const channel = page.getByRole("columnheader").filter({ hasText: "Channel" });
  const hs = await status.boundingBox();
  const hc = await channel.boundingBox();
  if (!hs || !hc) {
    throw new Error("headers not found");
  }
  await page.mouse.move(hs.x + 30, hs.y + hs.height / 2);
  await page.mouse.down();
  await page.mouse.move(hc.x + 30, hc.y + hc.height / 2, { steps: 6 });
  // Status..Channel across all 7 rows = 21 cells.
  await expect(
    page.locator('[role="gridcell"][aria-selected="true"]'),
  ).toHaveCount(21);
  await page.mouse.up();
});

test("a new drag after an existing selection still extends", async ({
  page,
}) => {
  await gotoDataGridStory(page, "selection");
  const status = page.getByTestId("selection-status");

  const a = await page.getByText("We shipped per-step").boundingBox();
  const b = await page.getByText("0.78").boundingBox();
  if (!a || !b) {
    throw new Error("cells not found");
  }
  await page.mouse.move(a.x + 10, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(status).toHaveText("6 cells selected");

  // A second drag from a different cell must paint a new range, not get stuck
  // on the start cell (regression: element blur cancelled the drag).
  const x = await page.getByText("5 things we learned").boundingBox();
  const y = await page.getByText("0.88").boundingBox();
  if (!x || !y) {
    throw new Error("cells not found");
  }
  await page.mouse.move(x.x + 10, x.y + x.height / 2);
  await page.mouse.down();
  await page.mouse.move(y.x + y.width / 2, y.y + y.height / 2, { steps: 5 });
  await expect(status).toHaveText("3 cells selected");
  await page.mouse.up();
});

test("the active-cell ring shows only for a single-cell selection", async ({
  page,
}) => {
  await gotoDataGridStory(page, "selection");
  const ringCount = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('[role="gridcell"]')].filter(
          (element) => {
            const shadow = getComputedStyle(element).boxShadow;
            return shadow !== "" && shadow !== "none";
          },
        ).length,
    );

  await page.getByText("Approved").first().click();
  await expect.poll(ringCount).toBe(1);

  // Extending to a multi-cell range drops the individual active-cell ring.
  await page.keyboard.press("Shift+ArrowRight");
  await expect.poll(ringCount).toBe(0);
});

test("dragging past the bottom edge auto-scrolls and extends", async ({
  page,
}) => {
  await gotoDataGridStory(page, "virtualized");
  await expect(page.getByRole("grid")).toBeVisible();

  const first = await page.getByText("Record 1:").first().boundingBox();
  const grid = await page.getByRole("grid").boundingBox();
  if (!first || !grid) {
    throw new Error("grid not found");
  }
  await page.mouse.move(first.x + 20, first.y + first.height / 2);
  await page.mouse.down();
  // Hold in the bottom edge zone; the body auto-scrolls far rows into view.
  await page.mouse.move(first.x + 20, grid.y + grid.height - 8, { steps: 4 });
  await expect(page.getByText(/Record 2[0-9]:/).first()).toBeVisible({
    timeout: 5000,
  });
  await page.mouse.up();
});

async function scrollGridToBottom(page: Page) {
  await page.evaluate(() => {
    const scroller = [...document.querySelectorAll('[role="grid"] *')].find(
      (element) => element.scrollHeight > element.clientHeight + 10,
    );
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  });
}

test("virtualizes a large grid, rendering only a window of rows", async ({
  page,
}) => {
  await gotoDataGridStory(page, "virtualized");
  await expect(page.getByRole("grid")).toBeVisible();

  // 1000 data rows, but only a windowed slice is in the DOM.
  const rendered = await page.locator('[role="grid"] [role="row"]').count();
  expect(rendered).toBeGreaterThan(10);
  expect(rendered).toBeLessThan(200);
});

test("infinite scroll appends rows when the body reaches its end", async ({
  page,
}) => {
  await gotoDataGridStory(page, "infinite-scroll");
  const count = page.getByTestId("row-count");
  await expect(count).toHaveText("30 rows");

  for (let step = 0; step < 4; step += 1) {
    await scrollGridToBottom(page);
    await page.waitForTimeout(400);
  }
  // Each end-reached fired the loader once and appended a 30-row page.
  await expect(count).not.toHaveText("30 rows");
  const text = await count.innerText();
  expect(Number(text.split(" ")[0])).toBeGreaterThan(30);
});

test("double-click edits a text cell; Enter commits and Escape reverts", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("Why we moved every workflow").dblclick();
  const input = page.locator("input").first();
  await expect(input).toBeVisible();
  await input.fill("Edited via the grid");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Edited via the grid")).toBeVisible();
  // Enter committed and moved the active cell down — focus stays on a grid cell.
  expect(
    await page.evaluate(() => document.activeElement?.getAttribute("role")),
  ).toBe("gridcell");

  // Escape reverts an in-progress edit.
  await page.getByText("Migrate your CRM in one dry-run").dblclick();
  await page.locator("input").first().fill("discarded text");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Migrate your CRM in one dry-run")).toBeVisible();
  await expect(page.getByText("discarded text")).toHaveCount(0);
});

test("number cell rejects non-numeric input", async ({ page }) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("0.78").first().dblclick();
  await page.getByLabel("Edit number").fill("abc");
  await page.keyboard.press("Enter");
  // Invalid input shows the inline error and keeps the editor open.
  await expect(page.getByText("Enter a number")).toBeVisible();
});

test("single-select cell edits through a dropdown", async ({ page }) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("Approved").first().dblclick();
  await expect(page.getByRole("menuitem", { name: "Published" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Published" }).click();
  await expect(page.getByText("Published").first()).toBeVisible();
});

test("multi-select cell adds an option via the combobox", async ({ page }) => {
  await gotoDataGridStory(page, "full-featured");

  await page.getByText("infra", { exact: true }).first().dblclick();
  const combo = page.getByPlaceholder("Add…");
  await expect(combo).toBeVisible();
  await combo.fill("ai");
  await page.getByRole("option", { name: "ai" }).click();
  // The new option becomes a removable chip in the editor.
  await expect(page.getByRole("button", { name: "Remove ai" })).toBeVisible();
});

test("column menu hides + sorts a field, and add column / add row work", async ({
  page,
}) => {
  await gotoDataGridStory(page, "full-featured");
  const status = page.getByTestId("chrome-status");

  // Hide the Tweet column → one fewer column header (the add-column (+) header
  // also counts, so assert relative to the starting count).
  const tweetMenu = page.getByRole("button", { name: "Tweet field options" });
  await expect(tweetMenu).toBeVisible();
  const before = await page.getByRole("columnheader").count();
  await tweetMenu.click();
  await page.getByRole("menuitem", { name: "Hide field" }).click();
  await expect(page.getByRole("columnheader")).toHaveCount(before - 1);

  // Sort the Status column ascending → aria-sort reflects it.
  await page.getByRole("button", { name: "Status field options" }).click();
  await page.getByRole("menuitem", { name: "Sort ascending" }).click();
  await expect(
    page.locator('[role="columnheader"][aria-sort="ascending"]'),
  ).toHaveCount(1);

  // Add a Date column via the (+) header picker.
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByRole("menuitem", { name: "Date" }).click();
  await expect(status).toContainText("add date");

  // Add a record via the trailing row.
  await page.getByRole("button", { name: "New record" }).click();
  await expect(status).toContainText("add row");
});

test("a rejected commit keeps the editor open and does not move", async ({
  page,
}) => {
  await gotoDataGridStory(page, "rejecting-edit");

  await page.getByText("Why we moved every workflow").dblclick();
  const input = page.locator("input").first();
  await expect(input).toBeVisible();
  await input.fill("should not save");
  await page.keyboard.press("Enter");

  // onCellChange rejected → the editor stays open and nothing is committed.
  await expect(page.locator("input").first()).toBeVisible();
  await expect(page.getByText("should not save")).toHaveCount(0);
});

test("hiding the active column keeps a keyboard tab stop", async ({ page }) => {
  await gotoDataGridStory(page, "full-featured");

  // Select a Status cell (makes it active), then hide the Status column.
  await page.getByText("Approved").first().click();
  await page.getByRole("button", { name: "Status field options" }).click();
  await page.getByRole("menuitem", { name: "Hide field" }).click();

  // The grid must still expose exactly one roving Tab stop.
  await expect(page.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
});

test("scrolls horizontally when the columns overflow the container", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await gotoDataGridStory(page, "basic");
  await expect(page.getByRole("grid")).toBeVisible();

  // Some element inside the grid overflows horizontally and is scrollable.
  const overflow = await page.evaluate(() => {
    const scroller = [...document.querySelectorAll('[role="grid"] *')]
      .map((element) => element as HTMLElement)
      .find((element) => element.scrollWidth > element.clientWidth + 5);
    return scroller
      ? { scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth }
      : null;
  });
  expect(overflow).not.toBeNull();
  expect(overflow!.scrollWidth).toBeGreaterThan(overflow!.clientWidth);
});

test("caps a lone flexible column and fills the leftover as empty grid area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await gotoDataGridStory(page, "few-columns");
  await expect(page.getByRole("grid", { name: "Tasks" })).toBeVisible();

  // The flexible Title column is capped near the default max (~480) instead of
  // stretching to fill the whole grid, so it stays well below the container.
  const titleWidth = await page
    .getByRole("columnheader")
    .filter({ hasText: "Title" })
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(titleWidth).toBeGreaterThan(200);
  expect(titleWidth).toBeLessThanOrEqual(485);

  // The header row still spans (nearly) the full grid width, so the leftover
  // reads as a clean empty area rather than a table that stops short.
  const spans = await page.evaluate(() => {
    const grid = document.querySelector('[role="grid"]') as HTMLElement;
    const headerRow = grid.querySelector('[role="row"]') as HTMLElement;
    return {
      headerRowWidth: headerRow.getBoundingClientRect().width,
      gridInnerWidth: grid.getBoundingClientRect().width,
    };
  });
  expect(spans.headerRowWidth).toBeGreaterThan(spans.gridInnerWidth - 12);
  // ...and the content is genuinely narrower than the grid (the cap took effect).
  expect(titleWidth + 130).toBeLessThan(spans.gridInnerWidth);
});

test("header and body columns share the same left edges, incl. after hiding", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "full-featured");
  await expect(page.getByRole("grid")).toBeVisible();

  const lefts = () =>
    page.evaluate(() => {
      const round = (n: number) => Math.round(n);
      const heads = [...document.querySelectorAll('[role="columnheader"]')].map(
        (el) => round(el.getBoundingClientRect().left),
      );
      const row = document.querySelector('[role="rowgroup"] [role="row"]');
      const cells = [...(row?.querySelectorAll('[role="gridcell"]') ?? [])].map(
        (el) => round(el.getBoundingClientRect().left),
      );
      return { heads, cells };
    });

  const assertAligned = async () => {
    const { heads, cells } = await lefts();
    expect(heads.length).toBe(cells.length);
    heads.forEach((left, i) =>
      expect(Math.abs(left - cells[i])).toBeLessThanOrEqual(1),
    );
  };

  await assertAligned();
  await page.getByRole("button", { name: "Score field options" }).click();
  await page.getByRole("menuitem", { name: "Hide field" }).click();
  await assertAligned();
});

test("keeps the row-number gutter pinned while scrolling horizontally", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 760 });
  await gotoDataGridStory(page, "full-featured");
  await expect(page.getByRole("grid")).toBeVisible();

  const gutterLeft = async () =>
    (await page.getByText("3", { exact: true }).first().boundingBox())?.x ?? 0;
  const before = await gutterLeft();
  await page.evaluate(() => {
    const scroller = [...document.querySelectorAll('[role="grid"] *')].find(
      (element) => element.scrollWidth > element.clientWidth + 5,
    );
    if (scroller) {
      scroller.scrollLeft = 300;
    }
  });
  await page.waitForTimeout(150);
  const after = await gutterLeft();
  // Sticky gutter: the row number stays put while data columns scroll away.
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
});

test("copies the selection and pastes it into another cell", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByText("0.81").first().click(); // select row 1 Score
  await page.keyboard.press("Control+c");
  await page.getByText("0.55").first().click(); // active = row 4 Score
  await page.keyboard.press("Control+v");

  // The value pasted into row 4, so "0.81" now appears twice.
  await expect(page.getByText("0.81")).toHaveCount(2);
});

async function columnWidths(page: Page) {
  return page.evaluate(() => {
    const round = (n: number) => Math.round(n);
    const heads = [...document.querySelectorAll('[role="columnheader"]')].map(
      (el) => round(el.getBoundingClientRect().width),
    );
    const row = document.querySelector('[role="rowgroup"] [role="row"]');
    const cells = [...(row?.querySelectorAll('[role="gridcell"]') ?? [])].map(
      (el) => round(el.getBoundingClientRect().width),
    );
    return { heads, cells };
  });
}

test("dragging a column's resize handle widens it and the body tracks it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "resizable");
  await expect(page.getByRole("grid")).toBeVisible();

  // Owner is the 5th column (index 4); grab its right-edge resize handle.
  const before = await columnWidths(page);
  const handle = page.getByRole("separator", { name: "Resize Owner" });
  const hb = await handle.boundingBox();
  if (!hb) {
    throw new Error("resize handle not found");
  }
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + 90, hb.y + hb.height / 2, {
    steps: 10,
  });
  await page.mouse.up();

  const after = await columnWidths(page);
  // The Owner column grew ~90px and the body cell stays the same width as its
  // header (they share resolved widths), while nothing got selected.
  expect(after.heads[4]).toBeGreaterThan(before.heads[4] + 60);
  expect(Math.abs(after.heads[4] - after.cells[4])).toBeLessThanOrEqual(1);
  // The Tweet column (index 0, flex) is frozen, not re-flowed, so it keeps its
  // width — only the dragged column's edge moves.
  expect(Math.abs(after.heads[0] - before.heads[0])).toBeLessThanOrEqual(2);
  await expect(
    page.locator('[role="gridcell"][aria-selected="true"]'),
  ).toHaveCount(0);
  // onColumnResize fired as a change notification.
  await expect(page.getByTestId("resize-status")).toContainText("owner");
});

test("arrow keys on a focused resize handle nudge the column width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "resizable");
  await expect(page.getByRole("grid")).toBeVisible();

  const before = await columnWidths(page);
  const handle = page.getByRole("separator", { name: "Resize Owner" });
  await handle.focus();
  // A focused handle shows a visible focus indicator (WCAG 2.4.7) — the browser
  // outline is suppressed, so assert the focus-ring box-shadow is painted.
  const shadow = await handle.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe("none");
  expect(shadow).not.toBe("");
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press("ArrowRight");
  }
  const wider = await columnWidths(page);
  expect(wider.heads[4]).toBeGreaterThan(before.heads[4]);

  await page.keyboard.press("ArrowLeft");
  const narrower = await columnWidths(page);
  expect(narrower.heads[4]).toBeLessThan(wider.heads[4]);
});

test("resizes a column with no onColumnResize handler (internal widths)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "basic");
  await expect(page.getByRole("grid")).toBeVisible();

  const before = await columnWidths(page);
  const handle = page.getByRole("separator", { name: "Resize Owner" });
  const hb = await handle.boundingBox();
  if (!hb) {
    throw new Error("resize handle not found");
  }
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + 70, hb.y + hb.height / 2, {
    steps: 8,
  });
  await page.mouse.up();

  const after = await columnWidths(page);
  expect(after.heads[4]).toBeGreaterThan(before.heads[4] + 40);
});

test("collapses to a card stack below the breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await gotoDataGridStory(page, "responsive");

  // Wide → the full grid.
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("columnheader").first()).toBeVisible();

  // Narrow → a read-only card stack, one card per record.
  await page.setViewportSize({ width: 460, height: 900 });
  await expect(page.getByRole("list")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(7);
  await expect(page.getByRole("grid")).toHaveCount(0);
});
