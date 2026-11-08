/**
 * Browser coverage for the calendar: views, recurring events, and creating
 * events.
 */
import { expect, test } from "@playwright/test";

test("calendar switches between month, week, and day views", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=calendar-examples--switchable-calendar");

  // The month view leads with the weekday header row (no time gutter yet).
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  await expect(page.getByText("All-day", { exact: true })).toBeHidden();

  // Switching to the week view swaps in the time grid (its all-day gutter and
  // hour labels appear); the segment is a radio in the SegmentedControl.
  await page.getByRole("radio", { name: "Week" }).click();
  await expect(page.getByRole("radio", { name: "Week" })).toBeChecked();
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(page.getByText("9 AM", { exact: true })).toBeVisible();

  // The week view carries a date header above the columns: each column shows its
  // weekday + day number (today's 2026-06-17 reads "Wed 17").
  await expect(page.getByTestId("calendar-col-header-2026-06-17")).toHaveText(
    "Wed17",
  );
  await expect(page.getByTestId("calendar-col-header-2026-06-15")).toHaveText(
    "Mon15",
  );

  // The day view keeps the time grid but collapses to a single column.
  await page.getByRole("radio", { name: "Day" }).click();
  await expect(page.getByRole("radio", { name: "Day" })).toBeChecked();
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("calendar-day-column-2026-06-17"),
  ).toBeVisible();

  // Back to the month view: the weekday header returns and the gutter is gone.
  await page.getByRole("radio", { name: "Month" }).click();
  await expect(page.getByRole("radio", { name: "Month" })).toBeChecked();
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  await expect(page.getByText("All-day", { exact: true })).toBeHidden();
});

test("calendar enforced view hides the switcher", async ({ page }) => {
  await page.goto("/iframe.html?id=calendar-examples--enforced-week-calendar");

  // The week view renders (its time gutter is present)...
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("calendar-day-column-2026-06-17"),
  ).toBeVisible();

  // ...but with a single enforced view there is no switcher at all.
  await expect(page.getByRole("radio", { name: "Week" })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Month" })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Day" })).toBeHidden();
});

test("calendar expands recurring events", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=calendar-examples--recurring-events-calendar",
  );

  // The month view is visible (weekday header present).
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();

  // The daily standup expands onto many cells across the month, so its chip
  // appears far more than once.
  await expect
    .poll(async () => page.getByText("Daily standup").count())
    .toBeGreaterThanOrEqual(10);

  // The weekly Tue/Thu sync also lands on multiple days in the visible month.
  await expect
    .poll(async () => page.getByText("Weekly sync").count())
    .toBeGreaterThanOrEqual(4);
});

test("calendar drag creates a timed event", async ({ page }) => {
  await page.goto("/iframe.html?id=calendar-examples--drag-to-create-calendar");

  // Before any drag the log shows the idle hint and no event blocks exist.
  const log = page.getByTestId("created-event-log");
  await expect(log).toHaveText("Drag the grid to create an event");

  const column = page.getByTestId("calendar-day-column-2026-06-17");
  const box = await column.boundingBox();
  expect(box).not.toBeNull();

  // Drag vertically down the day column to sweep out a multi-slot range, using
  // the same page.mouse pointer-drag idiom as the drag-select tests.
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const startY = (box?.y ?? 0) + 60;
  const endY = (box?.y ?? 0) + 180;
  await page.mouse.move(x, startY);
  await page.mouse.down();
  await page.mouse.move(x, endY, { steps: 10 });
  await page.mouse.up();

  // The log now reports a created timed range (start/end ISO datetimes), and a
  // new "New event" block is positioned in the grid.
  await expect(log).toContainText("Created");
  await expect(log).toContainText("2026-06-17T");
  await expect(
    page.getByRole("button", { name: /New event/ }).first(),
  ).toBeVisible();
});

test("calendar month view creates events by click and by drag across days", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=calendar-examples--month-drag-to-create-calendar",
  );

  const log = page.getByTestId("created-event-log");
  await expect(log).toHaveText(
    "Click a day, or drag across days, to create an event",
  );

  // The grid disables text selection so a drag never blue-highlights the day
  // numbers / event labels (the cascade reaches the day-number text too).
  const cell = page.getByTestId("calendar-month-cell-2026-06-10");
  expect(await cell.evaluate((el) => getComputedStyle(el).userSelect)).toBe(
    "none",
  );

  // A plain click on a day cell creates a single-day all-day event.
  await cell.click();
  await expect(log).toContainText("Created 2026-06-10 – 2026-06-10");

  // Dragging across several day cells creates a multi-day all-day event, using
  // the same page.mouse pointer-drag idiom as the drag-select tests.
  const startCell = page.getByTestId("calendar-month-cell-2026-06-16");
  const endCell = page.getByTestId("calendar-month-cell-2026-06-18");
  const startBox = await startCell.boundingBox();
  const endBox = await endCell.boundingBox();
  expect(startBox).not.toBeNull();
  expect(endBox).not.toBeNull();

  await page.mouse.move(
    (startBox?.x ?? 0) + (startBox?.width ?? 0) / 2,
    (startBox?.y ?? 0) + (startBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (endBox?.x ?? 0) + (endBox?.width ?? 0) / 2,
    (endBox?.y ?? 0) + (endBox?.height ?? 0) / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  // The log reports the multi-day all-day range, and the new event renders as a
  // labelled "New event" spanning bar.
  await expect(log).toContainText("Created 2026-06-16 – 2026-06-18");
  await expect(
    page.getByRole("button", { name: /New event/ }).first(),
  ).toBeVisible();
});
