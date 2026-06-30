import { expect, test } from "@playwright/test";

test("data grid renders typed columns, pills, dates, and a footer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=datagrid-examples--basic");

  await expect(page.getByRole("grid", { name: "Content" })).toBeVisible();
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
  await page.goto("/iframe.html?id=datagrid-examples--selection");

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
  await page.goto("/iframe.html?id=datagrid-examples--selection");

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
  await page.goto("/iframe.html?id=datagrid-examples--selection");

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
  // The range updates live during the drag (3 rows × 3 columns = 9 cells).
  await expect(status).toHaveText("9 cells selected");
  await expect(
    page.locator('[role="gridcell"][aria-selected="true"]'),
  ).toHaveCount(9);
  await page.mouse.up();
  await expect(status).toHaveText("9 cells selected");
});

async function scrollGridToBottom(page: import("@playwright/test").Page) {
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
  await page.goto("/iframe.html?id=datagrid-examples--virtualized");
  await expect(page.getByRole("grid")).toBeVisible();

  // 1000 data rows, but only a windowed slice is in the DOM.
  const rendered = await page.locator('[role="grid"] [role="row"]').count();
  expect(rendered).toBeGreaterThan(10);
  expect(rendered).toBeLessThan(200);
});

test("infinite scroll appends rows when the body reaches its end", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=datagrid-examples--infinite-scroll");
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
  await page.goto("/iframe.html?id=datagrid-examples--editable");

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
  await page.goto("/iframe.html?id=datagrid-examples--editable");

  await page.getByText("0.78").first().dblclick();
  await page.getByLabel("Edit number").fill("abc");
  await page.keyboard.press("Enter");
  // Invalid input shows the inline error and keeps the editor open.
  await expect(page.getByText("Enter a number")).toBeVisible();
});

test("single-select cell edits through a dropdown", async ({ page }) => {
  await page.goto("/iframe.html?id=datagrid-examples--editable");

  await page.getByText("Approved").first().dblclick();
  await expect(page.getByRole("menuitem", { name: "Published" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Published" }).click();
  await expect(page.getByText("Published").first()).toBeVisible();
});

test("multi-select cell adds an option via the combobox", async ({ page }) => {
  await page.goto("/iframe.html?id=datagrid-examples--full-featured");

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
  await page.goto("/iframe.html?id=datagrid-examples--full-featured");
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

test("collapses to a card stack below the breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto("/iframe.html?id=datagrid-examples--responsive");

  // Wide → the full grid.
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("columnheader").first()).toBeVisible();

  // Narrow → a read-only card stack, one card per record.
  await page.setViewportSize({ width: 460, height: 900 });
  await expect(page.getByRole("list")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(7);
  await expect(page.getByRole("grid")).toHaveCount(0);
});
