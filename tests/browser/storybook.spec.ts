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

  // Exact match so the clear button ("Clear Year ends") is not also selected.
  const input = page.getByLabel("Year ends", { exact: true });
  await expect(input).toHaveValue("31 Mar 2026");

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

test("date field clears its value with the clear button", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

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
  await page.goto("/iframe.html?id=date-examples--single-date-field");

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
