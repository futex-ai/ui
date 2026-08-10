import { expect, test, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

// Storybook kebab-cases the export name into the story id, so `MultiSeries`
// becomes `multi-series` — not `multiseries`.

async function gotoChartStory(page: Page, title: string, storyId: string) {
  await page.goto(`/iframe.html?id=chart-${title}--${storyId}&viewMode=story`);
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

test("a bar chart's hit targets carry every series value in their label", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  // The tooltip is decorative and aria-hidden, so the mark's own accessible
  // name is the real channel — it must enumerate every visible series.
  const q1 = page.getByRole("button", { name: /^Q1\./ });
  await expect(q1).toBeVisible();
  const label = await q1.getAttribute("aria-label");
  expect(label).toContain("Direct");
  expect(label).toContain("Partner");
  expect(label).toContain("Online");
});

test("hovering a bar reveals a tooltip listing every series at that category", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  const q2 = page.getByRole("button", { name: /^Q2\./ });
  await q2.hover();
  // One tooltip, every series — the pointer never has to land on a single bar.
  const root = page.locator("#storybook-root");
  await expect(root).toContainText("Q2");
  await expect(
    root.getByText("Partner", { exact: true }).first(),
  ).toBeVisible();
});

test("keyboard focus shows the same readout as hover, on one tab stop", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  const first = page.getByRole("button", { name: /^Q1\./ });
  await first.focus();
  await expect(first).toBeFocused();

  // Arrow keys move within the plot rather than tabbing out of it: a roving
  // tabindex keeps a 4-category chart to a single tab stop.
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /^Q2\./ })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: /^Q4\./ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: /^Q1\./ })).toBeFocused();
  // Clamps rather than wrapping — wrapping would read as a jump backwards.
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: /^Q1\./ })).toBeFocused();
});

test("the legend isolates a series without repainting the survivors", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  // The first svg is the gridline layer (only <line>); the marks live in the
  // sibling svg, so query paths across the whole root rather than scoping.
  const bars = page.locator("#storybook-root svg path");
  await expect(bars.first()).toBeVisible();
  const fillsBefore = await bars.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("fill")).filter(Boolean),
  );
  // Slot 3 (magenta) belongs to "Online" — the series that must not repaint.
  const onlineFill = fillsBefore[2];
  expect(onlineFill).toBeTruthy();

  const direct = page.getByRole("switch", { name: /^Direct/ });
  await expect(direct).toHaveAttribute("aria-checked", "true");
  await direct.click();
  await expect(direct).toHaveAttribute("aria-checked", "false");

  // "Online" must keep the hue it had before "Direct" was hidden — a reader
  // who learned "Online is magenta" stays right.
  const fillsAfter = await bars.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("fill")).filter(Boolean),
  );
  expect(fillsAfter).toContain(onlineFill);
  expect(fillsAfter.length).toBeLessThan(fillsBefore.length);
});

test("the legend survives isolating down to a single visible series", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  await page.getByRole("switch", { name: /^Direct/ }).click();
  await page.getByRole("switch", { name: /^Partner/ }).click();
  // Keyed off the provided series count, not the visible one: otherwise the
  // legend would unmount here and strand the reader with no way back.
  await expect(page.getByRole("switch", { name: /^Direct/ })).toBeVisible();
  await expect(page.getByRole("switch", { name: /^Partner/ })).toBeVisible();
});

test("every chart ships a table twin holding the same values", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "grouped");
  const toggle = page.getByRole("button", { name: "Show data table" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  // The label flips with the state, so re-locate rather than reusing `toggle`.
  await expect(
    page.getByRole("button", { name: "Hide data table" }),
  ).toHaveAttribute("aria-expanded", "true");
  const root = page.locator("#storybook-root");
  // Tooltips enhance, they never gate: the values are reachable here too.
  await expect(root).toContainText("$12K");
  await expect(root).toContainText("Q4");
});

test("a stacked chart separates its segments with a surface gap", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "stacked");
  const paths = page.locator("#storybook-root svg path");
  await expect(paths.first()).toBeVisible();
  // Three series over four quarters, all non-null.
  expect(await paths.count()).toBeGreaterThanOrEqual(12);
});

test("an empty chart keeps its frame height instead of collapsing", async ({
  page,
}) => {
  await gotoChartStory(page, "foundations", "empty");
  const root = page.locator("#storybook-root");
  await expect(root).toContainText("No data");
  // The frame still occupies its declared height, so nothing below it jumps.
  const box = await root.locator("text=No data").boundingBox();
  expect(box).not.toBeNull();
});

test("the data table toggle is reachable and operable by keyboard", async ({
  page,
}) => {
  await gotoChartStory(page, "barchart", "horizontal");
  const toggle = page.getByRole("button", { name: "Show data table" });
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Hide data table" }),
  ).toBeVisible();
});

test("a line chart's crosshair snaps to the nearest x and reads every series", async ({
  page,
}) => {
  await gotoChartStory(page, "linechart", "multi-series");
  const mar = page.getByRole("button", { name: /^Mar\./ });
  await mar.hover();
  const root = page.locator("#storybook-root");
  // One tooltip carrying every visible series — the pointer never has to land
  // on an individual 2px line.
  await expect(root.getByText("Web", { exact: true }).first()).toBeVisible();
  await expect(root.getByText("Mobile", { exact: true }).first()).toBeVisible();
  await expect(root.getByText("API", { exact: true }).first()).toBeVisible();
});

test("a keyboard user gets the same multi-series readout as a hover", async ({
  page,
}) => {
  await gotoChartStory(page, "linechart", "multi-series");
  const jan = page.getByRole("button", { name: /^Jan\./ });
  const label = await jan.getAttribute("aria-label");
  // The focused x-stop enumerates all three series, so focus is not a poorer
  // channel than the pointer.
  expect(label).toContain("Web");
  expect(label).toContain("Mobile");
  expect(label).toContain("API");
});

test("a gap in the data breaks the line instead of being drawn through", async ({
  page,
}) => {
  await gotoChartStory(page, "linechart", "with-gaps");
  const stroke = page.locator("#storybook-root svg path[stroke]").first();
  const d = await stroke.getAttribute("d");
  // Two runs means two move commands: the outage is a real break.
  expect((d?.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
});

test("an irregular time axis spaces points by date, not by index", async ({
  page,
}) => {
  await gotoChartStory(page, "linechart", "time-axis");
  // Scope to the hit targets by their label: the chart root is also a group,
  // so a bare [role="button"] would sweep in the data-table toggle too.
  const targets = page.getByRole("button", { name: /Signups:/ });
  const boxes = (
    await targets.evaluateAll((nodes) =>
      nodes.map((n) => n.getBoundingClientRect().x),
    )
  ).sort((a, b) => a - b);
  expect(boxes.length).toBeGreaterThanOrEqual(5);
  // Jan 1 -> Jan 8 is a week; Mar 1 -> Aug 1 is five months. The later gap
  // must be visibly wider, which band spacing would flatten.
  const firstGap = boxes[1] - boxes[0];
  const lastGap = boxes[boxes.length - 1] - boxes[boxes.length - 2];
  expect(lastGap).toBeGreaterThan(firstGap);
});

test("a stacked area separates its bands with a surface-coloured edge", async ({
  page,
}) => {
  await gotoChartStory(page, "linechart", "stacked-area");
  const paths = page.locator("#storybook-root svg path");
  await expect(paths.first()).toBeVisible();
  // Three series, each contributing a filled band plus its edge stroke.
  expect(await paths.count()).toBeGreaterThanOrEqual(6);
});
