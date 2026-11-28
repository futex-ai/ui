import { expect, test, type Page } from "@playwright/test";

import { bundleRnwFixture, openRnwFixture } from "./rnw/harness";

const submitCases = [
  {
    title: "multiline Enter submits once and keeps focus",
    field: "Message",
    focused: true,
    submissions: "1: Draft",
  },
  {
    title: "single-line Enter submits once and keeps focus",
    field: "Title",
    focused: true,
    submissions: "1: Draft",
  },
  {
    title: "multiline newline adds a line and keeps focus despite blurOnSubmit",
    field: "Name",
    focused: true,
    submissions: "0",
    value: "Draft\n",
  },
  {
    title: "single-line newline submits once and removes focus",
    field: "Reference",
    focused: false,
    submissions: "1: Draft",
  },
  {
    title:
      "explicit blurAndSubmit submits once and removes focus despite blurOnSubmit=false",
    field: "Summary",
    focused: false,
    submissions: "1: Draft",
  },
];

const hostRefs = [
  { name: "Details", role: "link", action: "Dim link", ref: "linkRef" },
  { name: "Save", role: "button", action: "Dim button", ref: "buttonRef" },
  {
    name: "Close panel",
    role: "button",
    action: "Dim header button",
    ref: "header buttonRef",
  },
  {
    name: "Reference list",
    role: "listbox",
    action: "Dim list",
    ref: "listRef",
  },
  {
    name: "Reference selector",
    role: "button",
    action: "Dim selector",
    ref: "triggerRef",
  },
] as const;

async function runRefAction(page: Page, action: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: action, exact: true }).click();
  expect(errors).toEqual([]);
}

for (const renderer of ["rnw", "dom"] as const) {
  test.describe(`${renderer} fields`, () => {
    let script: string;
    test.beforeAll(async () => {
      const { outputFiles } = await bundleRnwFixture(
        "fieldsFixture.jsx",
        renderer,
      );
      script = outputFiles[0].text;
    });

    for (const {
      title,
      field,
      focused,
      submissions,
      value = "Draft",
    } of submitCases) {
      test(title, async ({ page }) => {
        await page.clock.install({ time: 0 });
        await page.clock.pauseAt(1_000);
        await openRnwFixture(page, script);
        const input = page.getByRole("textbox", { name: field, exact: true });
        await input.press("End");
        await input.press("Enter");
        // Flush the blur task the renderer may schedule after Enter.
        await page.clock.runFor(1);

        const focus = expect.soft(input);
        await (focused ? focus : focus.not).toBeFocused();
        await expect.soft(input).toHaveValue(value);
        await expect(
          page.getByRole("status", { name: `${field} submissions` }),
        ).toHaveText(submissions);
      });
    }

    test("ArrowDown reopens the combobox after Escape", async ({ page }) => {
      await openRnwFixture(page, script);
      const combobox = page.getByRole("combobox", { name: "Categories" });
      const list = page.getByRole("listbox", { name: "Categories" });
      await combobox.click();
      await expect(list).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(list).toBeHidden();
      await expect(combobox).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(list).toBeVisible();
      await expect(combobox).toBeFocused();
    });

    for (const { action, name, ref, role } of hostRefs) {
      test(`${ref} applies a style through setNativeProps`, async ({
        page,
      }) => {
        await openRnwFixture(page, script);
        const host = page.getByRole(role, { name, exact: true });
        await expect(host).toHaveCSS("opacity", "1");
        await runRefAction(page, action);
        await expect(host).toHaveCSS("opacity", "0.5");
      });
    }

    test("inputRef replaces the text through setNativeProps", async ({
      page,
    }) => {
      await openRnwFixture(page, script);
      const input = page.getByRole("textbox", { name: "Reference text" });
      await expect(input).toHaveValue("Draft");
      await runRefAction(page, "Replace text");
      await expect(input).toHaveValue("Updated");
    });

    test("inputRef selects a range through setSelection", async ({ page }) => {
      await openRnwFixture(page, script);
      const input = page.getByRole("textbox", { name: "Reference text" });
      await runRefAction(page, "Select text");
      await expect(input).toBeFocused();
      await expect(input).toHaveJSProperty("selectionStart", 1);
      await expect(input).toHaveJSProperty("selectionEnd", 4);
    });
  });
}
