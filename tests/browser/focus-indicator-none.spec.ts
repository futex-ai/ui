import { expect, test } from "@playwright/test";

import { domBackendCss } from "../../src/primitives/dom/css";

import {
  expectBrowserOutline,
  expectNoIndicator,
  focusRingControls,
  focusWithKeyboard,
  gotoFocusRingStory,
} from "./focusRingHelpers";

for (const [label, storyId] of [
  ["theme focusIndicator none", "no-indicator-globally"],
  ["focusIndicator none", "no-indicator-per-control"],
] as const) {
  test(`${label} removes every focus style from each control`, async ({
    page,
  }) => {
    await gotoFocusRingStory(page, storyId);
    const controls = focusRingControls(page);
    const inputFrame = page
      .locator('[data-firna-focus-none="descendant"]')
      .filter({ has: controls.input });
    const switchTrack = controls.toggle.locator(
      '> [data-firna-focus-none="parent"]',
    );
    const restingBorder = await inputFrame.evaluate(
      (element) => getComputedStyle(element).borderColor,
    );

    await focusWithKeyboard(page, controls.button);
    await expectNoIndicator(controls.button);
    await expect(controls.button).toHaveAttribute(
      "data-firna-focus-none",
      "self",
    );

    await focusWithKeyboard(page, controls.input);
    await expectNoIndicator(inputFrame, controls.input);
    // The active border is focus styling too, so the frame keeps its resting
    // border while focused.
    await expect(inputFrame).toHaveCSS("border-color", restingBorder);

    await focusWithKeyboard(page, controls.segment);
    await expectNoIndicator(controls.segment);

    await focusWithKeyboard(page, controls.toggle);
    await expectNoIndicator(switchTrack, controls.toggle);

    // Forced-colors mode strips a caller's own shadows and fills, so the
    // system outline comes back on the focused element there.
    await page.emulateMedia({ forcedColors: "active" });
    expect(
      await controls.toggle.evaluate(
        (element) => getComputedStyle(element).outlineStyle !== "none",
      ),
    ).toBe(true);
  });
}

test("a caller-owned indicator replaces the field's own focus styles", async ({
  page,
}) => {
  await gotoFocusRingStory(page, "caller-owned-indicator");
  const field = page.getByRole("textbox", { name: "Search projects" });
  const frame = page
    .locator('[data-firna-focus-none="descendant"]')
    .filter({ has: field });
  const bar = frame.locator("..");
  const restingBar = await bar.evaluate(
    (element) => getComputedStyle(element).borderColor,
  );

  await focusWithKeyboard(page, field);
  await expectNoIndicator(frame, field);
  // The caller's own indicator: the bar recolors and thickens its border.
  await expect(bar).toHaveCSS("border-top-width", "2px");
  expect(
    await bar.evaluate((element) => getComputedStyle(element).borderColor),
  ).not.toBe(restingBar);

  // The clear button inside the field is its own tab stop and keeps the
  // browser outline, so the action Enter would take stays visible.
  await page.keyboard.type("Q3");
  await page.keyboard.press("Tab");
  const clear = page.getByRole("button", { name: "Clear Search projects" });
  await expect(clear).toBeFocused();
  await expectBrowserOutline(clear);
  await expect(bar).toHaveCSS("border-top-width", "1px");
});

test("static no-indicator markup strips the outline without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <style>a:focus{outline:2px solid rgb(1, 2, 3)}</style>
    <style>${domBackendCss}</style>
    <main>
      <button data-firna-focus-none="self">Button</button>
      <div data-firna-focus-none="descendant">
        <input aria-label="Input" data-firna-focus-target="true" />
        <button aria-label="Clear Input">x</button>
      </div>
      <button role="switch" data-firna-focus-target="true"><span data-firna-focus-none="parent"></span></button>
      <a data-firna-focus-none="self" href="#top">Caller styled</a>
    </main>`);

  const button = page.getByRole("button", { name: "Button" });
  const frame = page.locator('[data-firna-focus-none="descendant"]');
  const input = page.getByRole("textbox", { name: "Input" });
  const clear = page.getByRole("button", { name: "Clear Input" });
  const toggle = page.getByRole("switch");
  const styled = page.getByRole("link", { name: "Caller styled" });

  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await expectNoIndicator(button);
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await expectNoIndicator(frame, input);
  await page.keyboard.press("Tab");
  await expect(clear).toBeFocused();
  await expectBrowserOutline(clear);
  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await expectNoIndicator(toggle, toggle.locator("span"));
  // The reset has zero specificity, so a caller's own focus rule still wins
  // even when it is less specific than the marker and comes first.
  await page.keyboard.press("Tab");
  await expect(styled).toBeFocused();
  await expect(styled).toHaveCSS("outline-style", "solid");
  await expect(styled).toHaveCSS("outline-color", "rgb(1, 2, 3)");

  await input.focus();
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await input.evaluate(
      (element) => getComputedStyle(element).outlineStyle !== "none",
    ),
  ).toBe(true);
  await context.close();
});
