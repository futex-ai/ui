import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function editorChrome(locator: Locator, parentLevels = 0) {
  return locator.evaluate((element, levels) => {
    let frame: Element | null = element;
    for (let level = 0; level < levels; level += 1) {
      frame = frame?.parentElement ?? null;
    }
    if (!frame) {
      return null;
    }
    const style = getComputedStyle(frame);
    return {
      borderColor: style.borderTopColor,
      borderRadius: style.borderTopLeftRadius,
      borderWidth: style.borderTopWidth,
      boxShadow: style.boxShadow,
    };
  }, parentLevels);
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

test("a cell announces and displays its loading state while saving", async ({
  page,
}) => {
  await gotoDataGridStory(page, "saving-cell");

  await page.getByText("Why we moved every workflow").dblclick();
  const input = page.getByLabel("Edit cell");
  await expect(input).toBeVisible();
  await input.fill("Saved cell value");
  await page.keyboard.press("Enter");

  const busyCell = page.locator('[role="gridcell"][aria-busy="true"]');
  await expect(page.getByTestId("cell-save-status")).toContainText("Saving");
  await expect(busyCell).toHaveCount(1);
  await expect(
    busyCell.getByTestId("data-grid-cell-loading-indicator"),
  ).toBeVisible();
  const loadingContent = busyCell.getByTestId("data-grid-cell-loading-content");
  await expect(loadingContent).toHaveCSS("flex-direction", "row");
  await expect(loadingContent.getByText("Saved cell value")).toBeVisible();
  // The draft editor stays mounted but hidden until the save settles.
  await expect(input).toBeHidden();

  await expect(page.getByTestId("cell-save-status")).toHaveText("Ready", {
    timeout: 4_000,
  });
  await expect(busyCell).toHaveCount(0);
  await expect(page.getByText("Saved cell value")).toBeVisible();
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

test("a single click on an already-selected text cell opens its editor", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  const cell = page.getByText("Why we moved every workflow");
  // First click only selects the cell — no editor yet.
  await cell.click();
  await expect(page.locator("input")).toHaveCount(0);

  // Past the double-press window, a genuine single click on the now-active
  // cell opens the text editor (Airtable-style click-to-edit).
  await page.waitForTimeout(400);
  await cell.click();
  const input = page.locator("input").first();
  await expect(input).toBeVisible();
  await input.fill("Edited by a single click");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Edited by a single click")).toBeVisible();
});

test("dragging from the active cell paints a range instead of editing", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");
  const selected = page.locator('[role="gridcell"][aria-selected="true"]');

  // Select a cell (makes it the active single cell)...
  const start = page.getByText("Why we moved every workflow");
  await start.click();
  await expect(selected).toHaveCount(1);
  await page.waitForTimeout(400);

  // ...then press+drag from that same active cell: it extends the range and
  // does NOT open an editor (the tap-to-edit only fires on a click with no drag).
  const a = await start.boundingBox();
  const end = await page.getByText("0.55").first().boundingBox();
  if (!a || !end) {
    throw new Error("grid cells not found");
  }
  await page.mouse.move(a.x + 20, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(selected).toHaveCount(9);
  await expect(page.locator("input")).toHaveCount(0);
});

test("dragging the active cell into the gutter does not open the editor", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  const start = page.getByText("Why we moved every workflow");
  await start.click();
  await page.waitForTimeout(400);

  // Press the active cell and drag left, off the data cells and into the
  // row-number gutter, then release: the pointer left the cells so it is a
  // drag, not a click — the editor must NOT open.
  const a = await start.boundingBox();
  if (!a) {
    throw new Error("grid cell not found");
  }
  await page.mouse.move(a.x + 20, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x - 60, a.y + a.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator("input")).toHaveCount(0);
});

test("losing window focus mid-press does not open the editor", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  const start = page.getByText("Why we moved every workflow");
  await start.click();
  await page.waitForTimeout(400);

  // Press the active cell (no move, no release), then the window loses focus
  // (Alt-Tab / OS notification). That aborts the press — it is not a completed
  // click, so the editor must NOT open.
  const a = await start.boundingBox();
  if (!a) {
    throw new Error("grid cell not found");
  }
  await page.mouse.move(a.x + 20, a.y + a.height / 2);
  await page.mouse.down();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator("input")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator("input")).toHaveCount(0);
});

test("shift+double-press never opens the editor (shift is range-only)", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  // A shifted double-press is a range gesture, not an edit — no editor opens.
  await page
    .getByText("Why we moved every workflow")
    .dblclick({ modifiers: ["Shift"] });
  await expect(page.locator("input")).toHaveCount(0);
});

test("number cell rejects non-numeric input", async ({ page }) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("0.78").first().dblclick();
  await page.getByLabel("Edit number").fill("abc");
  await page.keyboard.press("Enter");
  // Invalid input shows the inline error and keeps the editor open.
  await expect(page.getByText("Enter a number")).toBeVisible();
});

test("in-cell editors square off their box to match the grid", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  // Text editor: the InputFrame box (the input's parent) is squared.
  await page.getByText("Migrate your CRM in one dry-run").dblclick();
  const textInput = page.locator("input").first();
  await expect(textInput).toBeVisible();
  expect(
    await textInput.evaluate(
      (el) =>
        getComputedStyle(el.parentElement as HTMLElement).borderTopLeftRadius,
    ),
  ).toBe("0px");
  await page.keyboard.press("Escape");

  // Number editor: same squared InputFrame box.
  await page.getByText("0.78").first().dblclick();
  const numberInput = page.getByLabel("Edit number");
  await expect(numberInput).toBeVisible();
  expect(
    await numberInput.evaluate(
      (el) =>
        getComputedStyle(el.parentElement as HTMLElement).borderTopLeftRadius,
    ),
  ).toBe("0px");
});

test("editor chrome keeps focus rings modality-aware", async ({ page }) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("Migrate your CRM in one dry-run").dblclick();
  const textInput = page.getByLabel("Edit cell");
  await expect(textInput).toBeFocused();
  const expectedChrome = await editorChrome(textInput, 1);
  expect(expectedChrome).toMatchObject({
    borderRadius: "0px",
    borderWidth: "1px",
  });
  expect(expectedChrome?.boxShadow).not.toBe("none");
  await page.keyboard.press("Escape");

  await page.getByText("Approved").first().dblclick();
  const selectTrigger = page.getByRole("button", { name: "Edit Status" });
  await expect(selectTrigger).toBeFocused();
  expect(await editorChrome(selectTrigger)).toEqual({
    ...expectedChrome,
    boxShadow: "none",
  });
  await page.keyboard.press("Escape");

  // The same editor entered from the keyboard gets the focus-visible ring.
  await page.keyboard.press("Enter");
  await expect(selectTrigger).toBeFocused();
  expect(await editorChrome(selectTrigger)).toEqual(expectedChrome);
  await page.keyboard.press("Escape");

  const dateCell = page
    .getByRole("row")
    .filter({ hasText: "How scoped agents stay fully auditable" })
    .getByText("30 Jun 2026");
  await dateCell.dblclick();
  const dateTrigger = page.getByRole("textbox", { name: "Created" });
  await expect(dateTrigger).toBeFocused();
  expect(await editorChrome(dateTrigger, 1)).toEqual(expectedChrome);
  await page.keyboard.press("Escape");

  const tagCell = page
    .getByRole("row")
    .filter({ hasText: "Why we moved every workflow" })
    .getByText("infra", { exact: true });
  await tagCell.dblclick();
  const multiSelectInput = page.getByPlaceholder("Add…");
  await expect(multiSelectInput).toBeFocused();
  expect(await editorChrome(multiSelectInput, 1)).toEqual(expectedChrome);
});

test("single-select cell edits through a dropdown", async ({ page }) => {
  await gotoDataGridStory(page, "editable");

  await page.getByText("Approved").first().dblclick();
  await expect(page.getByRole("menuitem", { name: "Published" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Published" }).click();
  await expect(page.getByText("Published").first()).toBeVisible();
});

test("a single click on an already-selected select cell opens its menu", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");

  // First click only selects the cell — no dropdown yet.
  await page.getByText("Approved").first().click();
  await expect(page.getByRole("menuitem", { name: "Published" })).toHaveCount(
    0,
  );

  // Wait past the double-press window so the next click is a genuine single
  // press, then click the now-active cell once to open its dropdown.
  await page.waitForTimeout(400);
  await page.getByText("Approved").first().click();
  await expect(page.getByRole("menuitem", { name: "Published" })).toBeVisible();
});

test("multi-select cell adds an option via the combobox", async ({ page }) => {
  await gotoDataGridStory(page, "full-featured");

  await page.getByText("infra", { exact: true }).first().dblclick();
  const combo = page.getByPlaceholder("Add…");
  await expect(combo).toBeVisible();
  // The combobox control box is squared to match the grid (nearest bordered
  // ancestor of the input).
  expect(
    await combo.evaluate((el) => {
      let node = el.parentElement;
      while (node) {
        const style = getComputedStyle(node);
        if (style.borderTopWidth !== "0px" && style.borderTopStyle !== "none") {
          return style.borderTopLeftRadius;
        }
        node = node.parentElement;
      }
      return null;
    }),
  ).toBe("0px");
  await combo.fill("ai");
  const aiOption = page.getByRole("option", { name: "ai" });
  await aiOption.click();
  // Compact mode keeps one full chip visible and summarizes the rest while the
  // option list exposes every selected value as an enabled toggle.
  await expect(aiOption).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("+2", { exact: true })).toBeVisible();
});

test("multi-select edit entry focuses and highlights the combobox", async ({
  page,
}) => {
  await gotoDataGridStory(page, "full-featured");

  const value = page.getByText("infra", { exact: true }).first();
  await value.click();
  await page.waitForTimeout(400);
  await value.click();
  const combo = page.getByRole("combobox", { name: "Edit Tags" });

  await expect(combo).toBeFocused();
  await expect(page.getByRole("option", { name: "growth" })).toBeVisible();
  await expect
    .poll(() =>
      combo.evaluate(
        (input) =>
          getComputedStyle(input.parentElement as HTMLElement).borderTopColor,
      ),
    )
    .toBe("rgb(79, 120, 100)");
});

test("loading-column multi-select stays compact and saves changes", async ({
  page,
}) => {
  await gotoDataGridStory(page, "loading-column");

  await page.getByText("infra", { exact: true }).first().dblclick();
  const combo = page.getByPlaceholder("Add…");
  await expect(combo).toBeVisible();
  const firstChipLabel = combo
    .locator("..")
    .getByText("launch", { exact: true });
  await expect(firstChipLabel).toBeVisible();
  expect(
    await firstChipLabel.evaluate(
      (label) => label.getBoundingClientRect().width,
    ),
  ).toBeGreaterThan(20);
  expect(
    await combo.evaluate(
      (input) => input.parentElement?.getBoundingClientRect().height,
    ),
  ).toBe(32);

  await combo.fill("growth");
  const growthOption = page.getByRole("option", { name: "growth" });
  await growthOption.click();
  await expect(growthOption).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("+2", { exact: true })).toBeVisible();

  await expect(growthOption).toBeEnabled();
  await growthOption.click();
  await expect(growthOption).toHaveAttribute("aria-selected", "false");
  await expect(page.getByText("+1", { exact: true })).toBeVisible();
  await growthOption.click();

  await page.getByText("0.81", { exact: true }).click();
  await expect(combo).toHaveCount(0);
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "We shipped per-step tool scoping" })
      .getByText("growth", { exact: true }),
  ).toBeVisible();
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

test("a copied single cell fills a whole selected range (Excel-style)", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByText("0.81").first().click(); // copy row 1 Score
  await page.keyboard.press("Control+c");

  // Select the next three Score cells (rows 2–4) and paste — the one value fills
  // the whole selection.
  await page.getByText("0.78").first().click();
  // The copy marquee is still shown on the source while picking the target.
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(1);
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Control+v");

  // Rows 1–4 Score all read 0.81 now.
  await expect(page.getByText("0.81")).toHaveCount(4);
  await expect(page.getByText("0.78")).toHaveCount(0);
  await expect(page.getByText("0.55")).toHaveCount(0);
  // The dashed marquee clears once the paste lands.
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(0);
});

test("Delete clears every cell in the selection", async ({ page }) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  // Select rows 1–2 of Score, then Delete clears both.
  await page.getByText("0.81").first().click();
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Delete");

  await expect(page.getByText("0.81")).toHaveCount(0);
  await expect(page.getByText("0.78")).toHaveCount(0);
});

test("cut moves a value and clears the source cell", async ({ page }) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByText("0.81").first().click(); // cut row 1 Score
  await page.keyboard.press("Control+x");
  // A marquee marks the cut source.
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(1);

  await page.getByText("0.55").first().click(); // active = row 4 Score
  await page.keyboard.press("Control+v");

  // Unlike copy, cut leaves the value in exactly one place (source cleared), and
  // the old row-4 value is gone. The marquee clears once the cut completes.
  await expect(page.getByText("0.81")).toHaveCount(1);
  await expect(page.getByText("0.55")).toHaveCount(0);
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(0);
});

test("cut moves a multi-cell range and clears all its source cells", async ({
  page,
}) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  // Cut rows 1–2 of Score (0.81, 0.78) — the marquee marks both source cells.
  await page.getByText("0.81").first().click();
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Control+x");
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(2);

  // Paste anchored at row 4 → rows 4–5 become 0.81 / 0.78; sources cleared.
  await page.getByText("0.55").first().click();
  await page.keyboard.press("Control+v");

  await expect(page.getByText("0.81")).toHaveCount(1);
  await expect(page.getByText("0.78")).toHaveCount(1);
  await expect(page.getByText("0.55")).toHaveCount(0); // row 4 overwritten
  await expect(page.getByText("0.64")).toHaveCount(0); // row 5 overwritten
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(0);
});

test("Escape dismisses the copy marquee", async ({ page }) => {
  await gotoDataGridStory(page, "editable");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByText("0.81").first().click();
  await page.keyboard.press("Control+c");
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("data-grid-copy-marquee")).toHaveCount(0);
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

  // An expandable card is a real `button` inside its listitem, not a listitem
  // that happens to be pressable — react-native-web resolves the DOM role as
  // `role || accessibilityRole`, and its press responder only presses Spacebar
  // on `button` roles, so a listitem-roled pressable would be Enter-only.
  const card = page.getByRole("button", { name: "Open record r1" });
  await expect(card).toBeVisible();
  await expect(page.getByRole("listitem").first()).not.toHaveAttribute(
    "tabindex",
    "0",
  );

  // Space expands the focused card and is swallowed, so the list does not
  // scroll under the user instead.
  await card.focus();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("Space");
  await expect(page.getByText("Expanded r1")).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  // Enter expands too, through react-native-web's own press handling.
  await page.getByRole("button", { name: "Open record r2" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Expanded r2")).toBeVisible();
});

const revealTooltip = (page: Page) =>
  page.getByTestId("data-grid-overflow-tooltip");

// Give the open delay time to elapse, then assert nothing appeared. Without the
// wait these would pass while the popover was merely still pending.
async function expectNoReveal(page: Page) {
  await page.waitForTimeout(900);
  await expect(revealTooltip(page)).toHaveCount(0);
}

test("a clipped column heading reveals its full name on hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();

  await expect(revealTooltip(page)).toHaveText("Campaign performance summary");
});

test("a heading that already fits stays quiet on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByRole("columnheader").filter({ hasText: "Owner" }).hover();

  await expectNoReveal(page);
});

test("moving off a clipped heading hides the reveal again", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();
  await expect(revealTooltip(page)).toBeVisible();

  await page.getByRole("columnheader").filter({ hasText: "Owner" }).hover();
  await expect(revealTooltip(page)).toHaveCount(0);
});

test("Escape dismisses the reveal", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();
  await expect(revealTooltip(page)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(revealTooltip(page)).toHaveCount(0);
});

test("a clipped text cell reveals its full value on hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByText("Waiting on legal review before the second send goes out.")
    .hover();

  await expect(revealTooltip(page)).toHaveText(
    "Waiting on legal review before the second send goes out.",
  );
});

test("a text cell that already fits stays quiet on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page.getByText("Short note.").hover();

  await expectNoReveal(page);
});

test("the reveal never appears while a range drag is in flight", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  // Press on a short cell, then drag across the clipped one. A popover opening
  // under the cursor would cover the cells the drag is painting.
  const start = page.getByText("Short note.");
  const box = await start.boundingBox();
  if (!box) {
    throw new Error("drag start cell not found");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const target = page.getByText(
    "Waiting on legal review before the second send goes out.",
  );
  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error("drag target cell not found");
  }
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 8 },
  );

  await expectNoReveal(page);
  await page.mouse.up();
});

test("overflowTooltip='headers' reveals headings but leaves cells quiet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-headers-only");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByText("Waiting on legal review before the second send goes out.")
    .hover();
  await expectNoReveal(page);

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();
  await expect(revealTooltip(page)).toHaveText("Campaign performance summary");
});

test("overflowTooltip='none' never reveals clipped text", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text-off");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();
  await expectNoReveal(page);
});

test("a press just after the pointer arrives cancels the pending reveal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  // A click moves the pointer and presses within a few milliseconds, so the
  // press can land before a state-driven effect would have subscribed to it.
  // The scheduled reveal still has to be cancelled, or it pops up over the very
  // cell that was just clicked — and duplicates its text in the DOM.
  await page
    .getByText("Waiting on legal review before the second send goes out.")
    .click();

  await expectNoReveal(page);
});

test("the reveal stays open while the pointer moves onto it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await gotoDataGridStory(page, "clipped-text");
  await expect(page.getByRole("grid")).toBeVisible();

  await page
    .getByRole("columnheader")
    .filter({ hasText: "Campaign performance summary" })
    .hover();
  const reveal = revealTooltip(page);
  await expect(reveal).toBeVisible();

  // WCAG 2.1 1.4.13 (Content on Hover or Focus, AA) requires hover-triggered
  // content to be *hoverable*: a magnifier user has to be able to move the
  // pointer onto a long name to read it without it vanishing on the way.
  const box = await reveal.boundingBox();
  if (!box) {
    throw new Error("reveal not found");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);

  await expect(reveal).toBeVisible();
});

test("the card stack reveals a clipped field value on hover", async ({
  page,
}) => {
  // Below cardBreakpoint the grid becomes a card stack — still a web
  // presentation with a real pointer, so clipped card values reveal too.
  await page.setViewportSize({ width: 460, height: 900 });
  await gotoDataGridStory(page, "clipped-text-cards");
  await expect(page.getByRole("list")).toBeVisible();

  await page
    .getByText("Waiting on legal review before the second send goes out.")
    .hover();

  await expect(revealTooltip(page)).toHaveText(
    "Waiting on legal review before the second send goes out.",
  );
});
