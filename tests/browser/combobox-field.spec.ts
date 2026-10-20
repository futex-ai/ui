import { expect, test } from "@playwright/test";

/**
 * Live behaviour of the `ComboboxMultiSelect` field that static markup cannot
 * show: the input's description, keyboard navigation, list order while
 * filtering, and the focus border. The static tests in
 * `tests/unit/staticComboboxField.test.ts` cover the rendered attributes.
 */
const story = (id: string) => `/iframe.html?id=dropdown-examples--${id}`;

test("the field describes its input with the error and the hint", async ({
  page,
}) => {
  await page.goto(story("chip-multi-select-validation"));
  const input = page.getByRole("combobox", { name: "Linked books" });
  await expect(input).toHaveAttribute("aria-required", "true");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(
    /Select at least one book to continue\.[\s\S]*Start typing to link/,
  );
  await expect(page.getByRole("alert")).toHaveText(
    "Select at least one book to continue.",
  );
});

test("arrow keys move the active option and Enter toggles it", async ({
  page,
}) => {
  await page.goto(story("chip-multi-select"));
  const input = page.getByRole("combobox", { name: "Linked books" });
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const payroll = page.getByRole("option", { name: "Payroll Reserve" });

  // The list opens on the selected option, so one step down reaches Payroll.
  await page.keyboard.press("ArrowDown");
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await payroll.getAttribute("id")) ?? "",
  );
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove Payroll Reserve" }),
  ).toBeVisible();
  await expect(input).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toBeFocused();
});

test("the empty state comes before the static footer note", async ({
  page,
}) => {
  await page.goto(story("input-backed-combobox"));
  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("zz");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toContainText("No matching options");
  // Raw text: the section rows are uppercased by CSS, which `innerText` applies.
  const text = (await listbox.textContent()) ?? "";
  const empty = text.indexOf("No matching options");
  const note = text.indexOf("Only active books can be selected.");
  expect(empty).toBeGreaterThanOrEqual(0);
  expect(note).toBeGreaterThan(empty);
});

test("focus gives the control the primary border", async ({ page }) => {
  await page.goto(story("chip-multi-select"));
  const control = page.locator('[data-firna-focus-ring="descendant"]');
  const border = () =>
    control.evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(await border()).toBe("rgba(28, 31, 29, 0.27)");
  await page.getByRole("combobox", { name: "Linked books" }).focus();
  await expect.poll(border).toBe("rgb(79, 120, 100)");
});

test("Tab leaves the field without stopping on an option row", async ({
  page,
}) => {
  await page.goto(story("chip-multi-select"));
  await page.getByRole("combobox", { name: "Linked books" }).click();
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Tab");
  const role = await page.evaluate(() =>
    document.activeElement?.getAttribute("role"),
  );
  expect(role).not.toBe("option");
});
