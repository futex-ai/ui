import { expect, test } from "@playwright/test";

test("dropdown selector opens, navigates with keyboard, and closes outside", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=shared-ui--dropdown-selector-default");

  await page.getByRole("button", { name: "Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Cash accounting" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Cash accounting" }).click();
  await expect(page.getByText("Flat rate")).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByText("Flat rate")).toBeHidden();
});

test("combobox keeps input focus while filtering options", async ({ page }) => {
  await page.goto("/iframe.html?id=shared-ui--input-backed-combobox");

  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("pay");

  await expect(page.getByText("Payroll Reserve")).toBeVisible();
  await expect(input).toBeFocused();
});

test("web modal restores focus and allows nested dropdowns above the surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=shared-ui--centered-web-modal");

  await page.getByRole("button", { name: "Close Invite teammate" }).click();
  const openButton = page.getByRole("button", { name: "Open Invite teammate" });
  await openButton.click();
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeHidden();
  await expect(openButton).toBeFocused();

  await openButton.click();
  await page.getByRole("button", { name: "Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  const modalBox = await page
    .getByRole("dialog", { name: "Invite teammate" })
    .boundingBox();
  const optionBox = await page.getByText("Cash accounting").boundingBox();
  expect(modalBox).not.toBeNull();
  expect(optionBox).not.toBeNull();
  expect(optionBox?.y).toBeGreaterThanOrEqual((modalBox?.y ?? 0) - 1);
});
