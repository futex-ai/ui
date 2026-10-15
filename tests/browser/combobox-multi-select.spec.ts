import { expect, test, type Page } from "@playwright/test";

/**
 * Grouped tag selection on `ComboboxMultiSelect`
 * (`docs/protocol/combobox-multi-select.md`). The tag picker story passes every
 * new prop: grouped options with descriptions, a disabled option, a locked
 * value, `singlePerGroup`, a muted chip, a static `footer` note, and a
 * `footerAction` that creates and selects a tag from the query.
 */

const TAG_PICKER =
  "/iframe.html?id=dropdown-examples--chip-multi-select-tag-picker";

async function openTagPicker(page: Page) {
  await page.goto(TAG_PICKER);
  const input = page.getByRole("combobox", { name: "Tags" });
  await input.click();
  await expect(page.getByRole("listbox", { name: "Tags" })).toBeVisible();
  return input;
}

async function activeOptionName(page: Page) {
  return page.evaluate(() => {
    const input = document.querySelector('[role="combobox"]');
    const id = input?.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.getAttribute("aria-label") : null;
  });
}

test("tag picker lists options under labelled group headings", async ({
  page,
}) => {
  await openTagPicker(page);
  const listbox = page.getByRole("listbox", { name: "Tags" });

  // Groups keep the order of their first option, each one a `role="group"`
  // named by its visible heading.
  const groups = listbox.getByRole("group");
  await expect(groups).toHaveCount(3);
  expect(
    await groups.evaluateAll((nodes) =>
      nodes.map((node) => {
        const heading = document.getElementById(
          node.getAttribute("aria-labelledby") ?? "",
        );
        return heading?.textContent;
      }),
    ),
  ).toEqual(["Properties", "Vehicles", "Projects"]);

  const vehicles = listbox.getByRole("group", { name: "Vehicles" });
  await expect(vehicles.getByRole("option")).toHaveText([
    /Renault Kangoo BX19 KLM/,
    /Skoda Octavia WK21 LMN/,
  ]);
  // The description is the option's accessible description.
  await expect(
    vehicles.getByRole("option", { name: "Renault Kangoo BX19 KLM" }),
  ).toHaveAccessibleDescription("UK rental property");
});

test("tag picker search matches option labels and whole group names", async ({
  page,
}) => {
  const input = await openTagPicker(page);
  const listbox = page.getByRole("listbox", { name: "Tags" });

  // A group-name match lists the whole group, case-insensitively.
  await input.fill("VEH");
  await expect(listbox.getByRole("group")).toHaveCount(1);
  await expect(
    listbox.getByRole("group", { name: "Vehicles" }).getByRole("option"),
  ).toHaveCount(2);

  // A label match keeps only the matching option, and hides empty groups.
  await input.fill("  loft ");
  await expect(listbox.getByRole("group")).toHaveCount(1);
  await expect(listbox.getByRole("option", { name: /Loft/ })).toBeVisible();
  await expect(listbox.getByRole("option", { name: /Mill/ })).toHaveCount(0);

  // No match keeps the empty row and the pinned footer action.
  await input.fill("zzz");
  await expect(listbox.getByText("No matching options")).toBeVisible();
  await expect(
    listbox.getByRole("option", { name: "Create tag “zzz”" }),
  ).toBeVisible();
});

test("disabled options are announced but cannot be chosen", async ({
  page,
}) => {
  await openTagPicker(page);
  const skoda = page.getByRole("option", { name: "Skoda Octavia WK21 LMN" });
  await expect(skoda).toHaveAttribute("aria-disabled", "true");
  await expect(skoda).toHaveAccessibleDescription("Consultancy trade");

  // A pointer press does nothing.
  const box = await skoda.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await expect(page.getByText(/Selected: flat2, fitout ·/)).toBeVisible();

  // Arrow keys still reach it (so it is announced), and Enter does nothing.
  await page.getByRole("combobox", { name: "Tags" }).focus();
  for (let step = 0; step < 6; step += 1) {
    if ((await activeOptionName(page)) === "Skoda Octavia WK21 LMN") break;
    await page.keyboard.press("ArrowDown");
  }
  expect(await activeOptionName(page)).toBe("Skoda Octavia WK21 LMN");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Selected: flat2, fitout ·/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove Skoda Octavia WK21 LMN" }),
  ).toHaveCount(0);
});

test("locked values keep a chip without a remove button and a fixed row", async ({
  page,
}) => {
  await openTagPicker(page);
  // The chip renders, but only the unlocked chip has a remove button.
  await expect(
    page.getByRole("button", { name: "Remove Flat 2, 14 Brook Street" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Remove Old office fit-out" }),
  ).toBeVisible();

  const flat = page.getByRole("option", { name: "Flat 2, 14 Brook Street" });
  await expect(flat).toHaveAttribute("aria-selected", "true");
  await expect(flat).toHaveAttribute("aria-disabled", "true");

  // Reachable by keyboard, but Enter cannot deselect it.
  await page.keyboard.press("ArrowUp");
  for (let step = 0; step < 8; step += 1) {
    if ((await activeOptionName(page)) === "Flat 2, 14 Brook Street") break;
    await page.keyboard.press("ArrowUp");
  }
  expect(await activeOptionName(page)).toBe("Flat 2, 14 Brook Street");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Selected: flat2, fitout ·/)).toBeVisible();

  // With `singlePerGroup`, the locked property fixes its group.
  await expect(
    page.getByRole("option", { name: "9 Mill Lane" }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("singlePerGroup replaces the group's value and still toggles off", async ({
  page,
}) => {
  await openTagPicker(page);
  await page.getByRole("option", { name: "Loft conversion" }).click();
  await expect(page.getByText(/Selected: flat2, loft ·/)).toBeVisible();

  await page.getByRole("combobox", { name: "Tags" }).click();
  await page.getByRole("option", { name: "Loft conversion" }).click();
  await expect(page.getByText(/Selected: flat2 ·/)).toBeVisible();

  await page.getByRole("combobox", { name: "Tags" }).click();
  await page.getByRole("option", { name: "Renault Kangoo BX19 KLM" }).click();
  await expect(page.getByText(/Selected: flat2, van ·/)).toBeVisible();
});

test("footer action runs from the keyboard with the trimmed query", async ({
  page,
}) => {
  const input = await openTagPicker(page);
  // "an" lists 9 Mill Lane (disabled) and Renault Kangoo, the last option.
  await input.fill("  an ");
  const action = page.getByRole("option", { name: "Create tag “an”" });
  await expect(action).toBeVisible();
  expect(await activeOptionName(page)).toBe("Renault Kangoo BX19 KLM");

  // ArrowDown moves from the last option onto the pinned action, which sits
  // inside the listbox so `aria-activedescendant` can point at it.
  await page.keyboard.press("ArrowDown");
  expect(await activeOptionName(page)).toBe("Create tag “an”");
  await expect(
    page.getByRole("listbox", { name: "Tags" }).getByRole("option", {
      name: "Create tag “an”",
    }),
  ).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.getByText(/Created: an$/)).toBeVisible();
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toHaveValue("");
  await expect(page.getByRole("button", { name: "Remove an" })).toBeVisible();
});

test("footer action runs from a press and stays pinned while rows scroll", async ({
  page,
}) => {
  await openTagPicker(page);
  const action = page.getByRole("option", { name: "Create tag" });
  const before = await action.boundingBox();
  await page
    .getByRole("listbox", { name: "Tags" })
    .getByRole("option", { name: "Old office fit-out" })
    .scrollIntoViewIfNeeded();
  const after = await action.boundingBox();
  expect(after?.y).toBe(before?.y);

  await action.click();
  await expect(page.getByText(/Created: New tag 7$/)).toBeVisible();
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("descriptions stay readable on the selected and active fills", async ({
  page,
}) => {
  await openTagPicker(page);
  const ratios = await page.evaluate(() => {
    function channel(value: number) {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }
    function luminance(color: string) {
      const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }
    function contrast(a: string, b: string) {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    }
    function descriptionContrast(name: string) {
      const row = document.querySelector(
        `[role="option"][aria-label="${name}"]`,
      );
      const id = row?.getAttribute("aria-describedby") ?? "";
      const text = document.getElementById(id);
      if (!row || !text) return 0;
      return contrast(
        getComputedStyle(text).color,
        getComputedStyle(row).backgroundColor,
      );
    }
    return {
      active: descriptionContrast("Renault Kangoo BX19 KLM"),
      selected: descriptionContrast("Flat 2, 14 Brook Street"),
    };
  });
  expect(ratios.selected).toBeGreaterThanOrEqual(4.5);
  expect(ratios.active).toBeGreaterThanOrEqual(4.5);
});

test("Enter on a chip's remove button removes that chip while the list is open", async ({
  page,
}) => {
  // The plain chip multi-select (no new props): the combobox's document key
  // listener used to claim Enter from any focused control, so Enter on a
  // remove button added the keyboard-active option instead.
  await page.goto("/iframe.html?id=dropdown-examples--chip-multi-select");
  const input = page.getByRole("combobox", { name: "Linked books" });
  await input.focus();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  expect(await activeOptionName(page)).toBe("VAT Archive");

  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Remove Greenhouse Studio" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("button", { name: "Remove Greenhouse Studio" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Remove VAT Archive" }),
  ).toHaveCount(0);
});
