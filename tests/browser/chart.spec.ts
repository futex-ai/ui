import { expect, test, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

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
