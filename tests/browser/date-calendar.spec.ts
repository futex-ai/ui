/**
 * Browser coverage for the date field's calendar: picking, layering, the
 * data-grid editor, and the year picker.
 */
import { expect, test } from "@playwright/test";

test("date field opens the calendar, navigates months, and picks a day", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open calendar popover is role="dialog" labelled by the field, so it
  // shares the "Year ends" accessible name with the input; target the textbox
  // explicitly. The visible month title also lives inside the dialog, while the
  // shared aria-live region announces the month on navigation (WCAG 4.1.3), so
  // scope month-text assertions to the dialog to skip the announced copy.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");
  // Clear is opt-in: the default field shows no clear button even with a value.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();

  // Focusing the input opens the calendar on the value's month.
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2026" }).click();
  await expect(input).toHaveValue("15 Mar 2026");
  await expect(dialog).toBeHidden();

  // Reopen and step to the previous month, then pick a day there.
  await input.click();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(dialog.getByText("February 2026")).toBeVisible();
  await page.getByRole("button", { name: "10 Feb 2026" }).click();
  await expect(input).toHaveValue("10 Feb 2026");
});

test("date calendar z-index override clears overlapping content", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--calendar-layering");

  const input = page.getByRole("textbox", { name: "Layered date" });
  await input.click();
  await expect(page.getByText("Overlapping panel")).toBeVisible();
  const calendar = page.getByRole("dialog", { name: "Layered date" });
  const day = page.getByRole("button", { name: "15 Mar 2026" });
  await expect(day).toBeVisible();

  const inputWidth = await input.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  const calendarWidth = await calendar.evaluate(
    (element) => element.parentElement?.getBoundingClientRect().width ?? 0,
  );
  expect(inputWidth).toBeGreaterThan(280);
  expect(calendarWidth).toBeCloseTo(280, 0);

  const topLabel = await day.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return (
      target?.closest("[aria-label]")?.getAttribute("aria-label") ??
      target?.textContent ??
      ""
    );
  });

  expect(topLabel).toBe("15 Mar 2026");
});

test("data-grid date editor uses the inline calendar on web", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=datagrid-examples--editable");

  const createdCell = page
    .getByRole("gridcell")
    .filter({ hasText: "29 Jun 2026" })
    .first();
  await createdCell.click();
  await createdCell.click();

  const input = page.getByRole("textbox", { name: "Created" });
  const calendar = page.getByRole("dialog", { name: "Created" });
  await expect(input).toBeFocused();
  await expect(calendar.getByText("June 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeHidden();

  await calendar.getByRole("button", { name: "28 Jun 2026" }).click();
  await expect(calendar).toBeHidden();
  await expect(
    page.getByRole("gridcell").filter({ hasText: "28 Jun 2026" }).first(),
  ).toBeVisible();
});

test("date field jumps to a far year through the header year picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover shares the "Year ends" name with the input (it is a
  // role="dialog" labelled by the field), so address the textbox by role; the
  // visible month title lives inside that dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();

  // Clicking the month/year title swaps the day grid for a year picker, where
  // the current year is shown selected and the day grid is gone.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  // The current year carries the filled selected background; an unselected year
  // is transparent. (RNW does not surface accessibilityState.selected as
  // aria-selected on role="button", matching the day cells, so assert the style.)
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const selectedBg = await page
    .getByRole("button", { exact: true, name: "2026" })
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(selectedBg).not.toBe("rgba(0, 0, 0, 0)");
  await expect(
    page.getByRole("button", { name: "Previous month" }),
  ).toBeHidden();

  // Picking a year in view jumps straight to it, keeps the month, and returns to
  // the day grid — without committing a date yet.
  await page.getByRole("button", { exact: true, name: "2018" }).click();
  await expect(dialog.getByText("March 2018")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Reopen the picker and page whole blocks forwards and backwards with the
  // header chevrons.
  await page.getByRole("button", { name: "March 2018, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2030" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Previous years" }).click();
  await page.getByRole("button", { name: "Previous years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2010" }),
  ).toBeVisible();

  // Choosing a year there, then a day, commits as usual and closes the calendar.
  await page.getByRole("button", { exact: true, name: "2010" }).click();
  await expect(dialog.getByText("March 2010")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2010" }).click();
  await expect(input).toHaveValue("15 Mar 2010");
  await expect(dialog).toBeHidden();
});

test("year picker returns to the day grid via the title and keeps keyboard focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover (role="dialog") shares the field's "Year ends" name, so
  // target the input by its textbox role; the month title lives in the dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();

  // Clicking the title again (now "back to month") returns to the day grid
  // without committing a date.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /back to month/ }).click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Selecting a year by keyboard moves focus to the relabelled title button
  // rather than stranding it on <body> when the chosen year cell unmounts.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await page.getByRole("button", { exact: true, name: "2024" }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("March 2024")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "March 2024, change year" }),
  ).toBeFocused();
});

test("bounded date field disables out-of-range years in the picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-date-field");

  const input = page.getByLabel("Year ends");
  await input.click();
  await page.getByRole("button", { name: "March 2026, change year" }).click();

  // Years inside the [2024, 2027] window are pickable; years outside it are not.
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2023" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2016" }),
  ).toBeDisabled();
});
