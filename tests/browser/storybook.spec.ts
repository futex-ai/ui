import { expect, test, type Page } from "@playwright/test";

test("dropdown selector opens, navigates with keyboard, and closes outside", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-selector-default",
  );

  await page.getByRole("button", { name: "Scheme, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Scheme, Cash accounting" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Scheme, Cash accounting" }).click();
  await expect(page.getByText("Flat rate")).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByText("Flat rate")).toBeHidden();
});

test("dropdown keyboard navigation keeps the active option in view", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--long-dropdown-selector");

  await page.getByRole("button", { name: "Long list, Long option 01" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "Long option 01" }),
  ).toBeVisible();

  for (let step = 0; step < 15; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  await expect
    .poll(() => dropdownScrollState(page, "Long option 16"))
    .toMatchObject({
      activeInView: true,
      scrolled: true,
    });
});

test("dropdown selector pins header and footer while options scroll", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--selector-with-header-footer",
  );

  await page.getByRole("button", { name: "Scheme, Long option 01" }).click();

  const header = page.getByText("Choose a scheme");
  const footer = page.getByRole("button", { name: "Add scheme" });
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  const option = page.getByRole("button", {
    exact: true,
    name: "Long option 03",
  });
  const headerBefore = await header.boundingBox();
  const footerBefore = await footer.boundingBox();
  const optionBefore = await option.boundingBox();

  for (let step = 0; step < 18; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  const headerAfter = await header.boundingBox();
  const footerAfter = await footer.boundingBox();
  const optionAfter = await option.boundingBox();

  // The option rows scroll up...
  expect(optionBefore).not.toBeNull();
  expect(optionAfter).not.toBeNull();
  expect(
    Math.abs((optionAfter?.y ?? 0) - (optionBefore?.y ?? 0)),
  ).toBeGreaterThan(20);

  // ...while the pinned header and footer keep their position and stay visible.
  expect(headerBefore).not.toBeNull();
  expect(footerBefore).not.toBeNull();
  expect(
    Math.abs((headerAfter?.y ?? 0) - (headerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs((footerAfter?.y ?? 0) - (footerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  // The footer must sit fully inside the clipping surface; the surface padding
  // previously pushed it past the overflow:hidden bottom edge and clipped it.
  expect(await bottomOverflowPast(footer, "clip")).toBeLessThanOrEqual(1);
});

async function bottomOverflowPast(
  locator: ReturnType<Page["getByRole"]>,
  _label: string,
) {
  return locator.evaluate((element) => {
    let clip = element.parentElement;
    while (clip) {
      const overflowY = getComputedStyle(clip).overflowY;
      if (
        overflowY === "hidden" ||
        overflowY === "auto" ||
        overflowY === "scroll"
      ) {
        break;
      }
      clip = clip.parentElement;
    }
    if (!clip) {
      return 0;
    }
    return (
      element.getBoundingClientRect().bottom -
      clip.getBoundingClientRect().bottom
    );
  });
}

test("searchable dropdown selector filters options and selects by keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--searchable-selector");

  await page.getByRole("button", { name: "Currency, US Dollar" }).click();

  // The search input is focused on open. Typing (including the space bar, which
  // must reach the input rather than activate a row) narrows the option rows
  // while keeping focus in the input.
  const search = page.getByPlaceholder("Search options");
  await expect(search).toBeFocused();

  // The search field's border lines up with the option rows' (selected)
  // background, so its left and right edges match the highlighted row.
  const alignment = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Search options"]');
    const field = input?.parentElement ?? null;
    const selectedRow =
      Array.from(document.querySelectorAll('[role="button"]')).find(
        (element) =>
          element.textContent?.trim() === "US Dollar" &&
          !element.hasAttribute("aria-expanded"),
      ) ?? null;
    if (!field || !selectedRow) {
      return null;
    }
    const fieldRect = field.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    return {
      left: Math.abs(fieldRect.left - rowRect.left),
      right: Math.abs(fieldRect.right - rowRect.right),
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.left).toBeLessThanOrEqual(1);
  expect(alignment?.right).toBeLessThanOrEqual(1);

  await search.pressSequentially("new z");
  await expect(
    page.getByRole("button", { exact: true, name: "New Zealand Dollar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "US Dollar" }),
  ).toBeHidden();
  await expect(search).toBeFocused();

  // Enter activates the highlighted match and closes the menu.
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Currency, New Zealand Dollar" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search options")).toBeHidden();

  // Reopening starts from the full list again; a non-matching query shows the
  // empty state.
  await page
    .getByRole("button", { name: "Currency, New Zealand Dollar" })
    .click();
  await page.getByPlaceholder("Search options").fill("zzz");
  await expect(page.getByText("No matching options")).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Euro" }),
  ).toBeHidden();
});

test("combobox keeps input focus while filtering options", async ({ page }) => {
  await page.goto("/iframe.html?id=dropdown-examples--input-backed-combobox");

  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("pay");

  await expect(page.getByText("Payroll Reserve")).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("zz");
  await expect(page.getByText("No matching options")).toBeVisible();
  await expect(
    page.getByText("Only active books can be selected."),
  ).toBeVisible();
});

test("segmented control toggles report and source choices", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  await expect(
    page.getByRole("radio", { name: "Profit & loss" }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "Balance sheet" }).click();
  await expect(
    page.getByRole("radio", { name: "Balance sheet" }),
  ).toBeChecked();

  await expect(page.getByRole("radio", { name: "Combined" })).toBeChecked();
  await page.getByRole("radio", { name: "Consulting" }).click();
  await expect(page.getByRole("radio", { name: "Consulting" })).toBeChecked();
});

test("radio cards expose checked and disabled option states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--accounting-basis-radio-cards",
  );

  const cash = page.getByRole("radio", { name: /Cash basis/ });
  const accrual = page.getByRole("radio", { name: /Accrual basis/ });
  const flatRate = page.getByRole("radio", { name: /Flat rate VAT/ });

  await expect(cash).toBeChecked();
  await accrual.click();
  await expect(accrual).toBeChecked();
  await expect(cash).not.toBeChecked();
  await cash.focus();
  await page.keyboard.press("Space");
  await expect(cash).toBeChecked();
  await expect(accrual).not.toBeChecked();
  await expect(flatRate).toBeDisabled();
});

test("switch toggles a binary setting", async ({ page }) => {
  await page.goto("/iframe.html?id=switch-examples--privacy-toggle");

  const toggle = page.getByRole("switch", { name: "Analytics cookies" });
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
});

test("web modal restores focus and allows nested dropdowns above the surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--centered-web-modal");

  await page.getByRole("button", { name: "Close Invite teammate" }).click();
  const openButton = page.getByRole("button", { name: "Open Invite teammate" });
  await openButton.click();
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeVisible();

  const textField = page.getByLabel("Modal text field");
  await textField.fill("Focus stays here");
  await expect(textField).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeHidden();
  await expect(openButton).toBeFocused();

  await openButton.click();
  const closeButton = page.getByRole("button", {
    name: "Close Invite teammate",
  });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textField).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Nested selector, Standard" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();

  await page.getByRole("button", { name: "Nested selector, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  const modalBox = await page
    .getByRole("dialog", { name: "Invite teammate" })
    .boundingBox();
  const optionBox = await page.getByText("Cash accounting").boundingBox();
  expect(modalBox).not.toBeNull();
  expect(optionBox).not.toBeNull();
  expect(optionBox?.y).toBeGreaterThanOrEqual((modalBox?.y ?? 0) - 1);
});

test("date field opens the calendar, navigates months, and picks a day", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  const input = page.getByLabel("Year ends");
  await expect(input).toHaveValue("31 Mar 2026");
  // Clear is opt-in: the default field shows no clear button even with a value.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();

  // Focusing the input opens the calendar on the value's month.
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2026" }).click();
  await expect(input).toHaveValue("15 Mar 2026");
  await expect(page.getByText("March 2026")).toBeHidden();

  // Reopen and step to the previous month, then pick a day there.
  await input.click();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.getByText("February 2026")).toBeVisible();
  await page.getByRole("button", { name: "10 Feb 2026" }).click();
  await expect(input).toHaveValue("10 Feb 2026");
});

test("date field jumps to a far year through the header year picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  const input = page.getByLabel("Year ends");
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();

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
  await expect(page.getByText("March 2018")).toBeVisible();
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
  await expect(page.getByText("March 2010")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2010" }).click();
  await expect(input).toHaveValue("15 Mar 2010");
  await expect(page.getByText("March 2010")).toBeHidden();
});

test("year picker returns to the day grid via the title and keeps keyboard focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  const input = page.getByLabel("Year ends");
  await input.click();

  // Clicking the title again (now "back to month") returns to the day grid
  // without committing a date.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /back to month/ }).click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Selecting a year by keyboard moves focus to the relabelled title button
  // rather than stranding it on <body> when the chosen year cell unmounts.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await page.getByRole("button", { exact: true, name: "2024" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("March 2024")).toBeVisible();
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

test("popover opens content and closes by Escape, inside close, and outside press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--content-popover");

  const trigger = page.getByRole("button", { name: "Details" });
  const content = page.getByText("Greenhouse Studio");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();

  // Pressing the trigger opens the surface and reports the expanded state.
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Escape closes it.
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // A close control inside the content closes it via the render-prop `close`.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(content).toBeHidden();

  // An outside press dismisses it through the document-level listener.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(content).toBeHidden();
});

test("controlled popover drives external state through onOpenChange", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--controlled-popover");

  const trigger = page.getByRole("button", { name: "Account" });
  const content = page.getByText("Greenhouse Studio");
  const status = page.getByText("Popover is closed");

  // The surface only opens because onOpenChange updated the external state that
  // feeds the controlled `open` prop back in.
  await expect(status).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Popover is open")).toBeVisible();
  await expect(content).toBeVisible();

  // Each dismissal path fires onOpenChange, which closes it via external state.
  await page.keyboard.press("Escape");
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();
});

test("date field clears its value with the clear button", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // Exact match so the clear button ("Clear Year ends") is not also selected.
  const input = page.getByLabel("Year ends", { exact: true });
  await expect(input).toHaveValue("31 Mar 2026");

  // Open the calendar, then clear: clearing empties the field and closes the
  // calendar without popping a fresh one (focus returns to the empty input).
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "Clear Year ends" }).click();

  await expect(input).toHaveValue("");
  await expect(page.getByText("March 2026")).toBeHidden();
  await expect(page.getByText("June 2026")).toBeHidden();
  // The clear button is gone once there is nothing left to clear.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("date field clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  const input = page.getByLabel("Year ends", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });

  // Tabbing from the input reaches the clear button (the calendar icon is
  // tabIndex=-1 and skipped).
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();

  // Activating it via the keyboard clears the value and returns focus to the
  // now-empty input rather than dropping focus to the body.
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
});

test("date clear button tracks the committed value, not the typed buffer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  const input = page.getByLabel("Year ends", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");

  // Deleting all the text mid-edit does NOT commit (empty is unparseable), so
  // the committed date remains and the clear button stays visible.
  await input.focus();
  await input.fill("");
  await expect(clear).toBeVisible();

  // Now actually clear it, then type unparseable partial text into the empty
  // field: there is no committed value, so no clear button appears.
  await clear.click();
  await expect(input).toHaveValue("");
  await input.fill("5 Ju");
  await expect(clear).toBeHidden();
});

test("input field highlights validation state and clears it on valid input", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--validated-field");

  // The visible label names the input, and the error message turns the field
  // invalid (announced via aria-invalid).
  const input = page.getByLabel("Email");
  await expect(input).toHaveValue("not-an-email");
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");

  // A valid value drops the error and the invalid state.
  await input.fill("ada@example.com");
  await expect(page.getByText("Enter a valid email address")).toBeHidden();
  await expect(input).toHaveAttribute("aria-invalid", "false");
});

test("input clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--clearable-field");

  const input = page.getByLabel("Search", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Search" });
  await expect(input).toHaveValue("Quarterly report");
  await expect(clear).toBeVisible();

  // Tab from the input reaches the clear button (no decorative icon to skip
  // here), then Enter clears the value and returns focus to the empty input.
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  // The clear button is gone once there is nothing left to clear.
  await expect(clear).toBeHidden();
});

test("input password suffix toggles between show and hide", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--password-field");

  // Exact so the "Show password" suffix button is not also matched.
  const input = page.getByLabel("Password", { exact: true });
  await input.fill("hunter2");

  // The suffix icon is an accessible button (it has a label) whose name flips as
  // it toggles the masked input.
  const show = page.getByRole("button", { name: "Show password" });
  await expect(show).toBeVisible();
  await show.click();
  await expect(
    page.getByRole("button", { name: "Hide password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show password" }),
  ).toBeHidden();
});

async function dropdownScrollState(page: Page, label: string) {
  return page
    .getByRole("button", { exact: true, name: label })
    .evaluate((element) => {
      let scrollParent = element.parentElement;
      while (scrollParent) {
        if (scrollParent.scrollHeight > scrollParent.clientHeight) {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent) {
        return { activeInView: false, scrolled: false };
      }
      const activeRect = element.getBoundingClientRect();
      const viewportRect = scrollParent.getBoundingClientRect();
      return {
        activeInView:
          activeRect.top >= viewportRect.top - 1 &&
          activeRect.bottom <= viewportRect.bottom + 1,
        scrolled: scrollParent.scrollTop > 0,
      };
    });
}
