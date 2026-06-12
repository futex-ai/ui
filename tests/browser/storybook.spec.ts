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
  await expect(toggle).toBeChecked();
  await toggle.click();
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
