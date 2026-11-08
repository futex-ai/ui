/**
 * Browser coverage for text inputs and textareas: validation, clearing,
 * password visibility, auto-grow, and seamless fields.
 */
import { expect, test } from "@playwright/test";

test("auto-growing textarea grows with content, caps, and shrinks back", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--auto-growing-textarea");

  const textarea = page.getByRole("textbox", { name: "Release notes" });
  const heightOf = async () => (await textarea.boundingBox())?.height ?? 0;

  // It opens at its two-row minimum.
  const initial = await heightOf();
  expect(initial).toBeGreaterThan(0);

  // Adding lines grows the box (well past the two-row start).
  await textarea.fill("one\ntwo\nthree\nfour\nfive");
  await expect.poll(heightOf).toBeGreaterThan(initial + 20);
  const grown = await heightOf();

  // Past the six-row cap it stops growing — 40 lines is barely taller than 5.
  await textarea.fill(
    Array.from({ length: 40 }, (_, index) => `line ${index}`).join("\n"),
  );
  const capped = await heightOf();
  expect(capped).toBeLessThan(grown + 30);

  // Deleting content shrinks it back toward the two-row minimum.
  await textarea.fill("back to one line");
  await expect.poll(heightOf).toBeLessThan(grown);
});

test("seamless fields render chrome-less, stay editable, and grow to fit", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--seamless-editor");

  const title = page.getByRole("textbox", { name: "Document title" });
  const body = page.getByRole("textbox", { name: "Document body" });

  // Chrome-less at rest: the single-line field's box carries no border and no
  // fill, so it reads as plain text rather than a control. (The box is the
  // input's parent element.)
  const titleBoxChrome = await title.evaluate((input) => {
    const box = input.parentElement as HTMLElement;
    const style = getComputedStyle(box);
    return {
      background: style.backgroundColor,
      borderWidth: style.borderTopWidth,
    };
  });
  expect(titleBoxChrome.background).toBe("rgba(0, 0, 0, 0)");
  expect(titleBoxChrome.borderWidth).toBe("0px");

  // Still a real, editable input.
  await title.fill("Launch checklist");
  await expect(title).toHaveValue("Launch checklist");

  // The height-less, zero-padding seamless box must still reserve enough height
  // for its raised 22px title font — the box sizes to the font/line box rather
  // than clipping the glyphs to a shorter fixed line height.
  const titleHeight = await title.evaluate(
    (input) => (input as HTMLInputElement).clientHeight,
  );
  expect(titleHeight).toBeGreaterThanOrEqual(22);

  // The seamless multiline body grows to fit ALL its content — no cap, no
  // scrollbar: 30 lines are far taller than one, and the field's own height
  // matches its scrollHeight (nothing is clipped/scrolled away).
  const bodyMetrics = async () =>
    body.evaluate((node) => {
      const element = node as HTMLTextAreaElement;
      return { height: element.clientHeight, scroll: element.scrollHeight };
    });

  await body.fill("one line");
  const single = await bodyMetrics();

  await body.fill(Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n"));
  await expect
    .poll(async () => (await bodyMetrics()).height)
    .toBeGreaterThan(single.height + 100);
  const many = await bodyMetrics();
  // Grow-to-fit: the visible height keeps up with the content (no inner scroll).
  expect(many.scroll - many.height).toBeLessThanOrEqual(2);
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

test("textarea field renders multiline input and clears back to focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--textarea-field");

  const textarea = page.getByLabel("Project notes", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Project notes" });
  await expect(textarea).toHaveJSProperty("tagName", "TEXTAREA");
  await expect(textarea).toHaveValue(
    "Initial scope notes\nFollow up with implementation details",
  );
  await expect(clear).toBeVisible();

  await textarea.fill("Line one\nLine two");
  await expect(textarea).toHaveValue("Line one\nLine two");
  await textarea.focus();
  await textarea.press("Tab");
  await expect(clear).toBeFocused();
  await clear.press("Enter");
  await expect(textarea).toHaveValue("");
  await expect(textarea).toBeFocused();
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
