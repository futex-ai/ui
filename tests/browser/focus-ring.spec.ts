import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  DOM_BACKEND_STYLE_ID,
  domBackendCss,
  TEXT_CLASS,
  TEXT_INPUT_CLASS,
  VIEW_CLASS,
} from "../../src/primitives/dom/css";

const DEFAULT_GLOW = "rgba(79, 120, 100, 0.35)";
const storyReadyTimeout = 30_000;

async function gotoFocusRingStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=focus-ring-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

async function focusWithKeyboard(page: Page, target: Locator) {
  await target.focus();
  await page.keyboard.press("Shift");
  await expect
    .poll(() => target.evaluate((element) => element.matches(":focus-visible")))
    .toBe(true);
}

async function expectGlow(target: Locator, inset = false) {
  await expect(target).toHaveCSS("outline-style", "none");
  const shadow = await target.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  expect(shadow).toContain(DEFAULT_GLOW);
  expect(shadow).toContain("0px 0px 0px 4px");
  expect(shadow.includes("inset")).toBe(inset);
}

async function expectBrowserOutline(target: Locator) {
  await expect(target).toHaveCSS("box-shadow", "none");
  expect(
    await target.evaluate(
      (element) => getComputedStyle(element).outlineStyle !== "none",
    ),
  ).toBe(true);
}

function focusRingControls(page: Page) {
  const button = page.getByRole("button", { name: "Save" });
  const input = page.getByRole("textbox", { name: "Project name" });
  const inputFrame = page
    .locator('[data-firna-focus-host="descendant"]')
    .filter({ has: input });
  const segment = page.getByRole("radio", { name: "Daily" });
  const toggle = page.getByRole("switch", { name: "Notifications" });
  const switchTrack = toggle.locator('> [data-firna-focus-host="parent"]');
  return { button, input, inputFrame, segment, switchTrack, toggle };
}

test("CSS focus glow follows keyboard and pointer modality", async ({
  page,
}) => {
  await gotoFocusRingStory(page, "ring-enabled-default");
  const controls = focusRingControls(page);

  await focusWithKeyboard(page, controls.button);
  await expectGlow(controls.button);

  await focusWithKeyboard(page, controls.input);
  await expectGlow(controls.inputFrame);
  await expect(controls.input).toHaveCSS("outline-style", "none");

  await focusWithKeyboard(page, controls.segment);
  await expectGlow(controls.segment, true);

  await focusWithKeyboard(page, controls.toggle);
  await expectGlow(controls.switchTrack);
  await expect(controls.toggle).toHaveCSS("outline-style", "none");

  await page.reload();
  const pointerControls = focusRingControls(page);
  await pointerControls.button.click();
  await expect(pointerControls.button).toHaveCSS("box-shadow", "none");
  await pointerControls.segment.click();
  await expect(pointerControls.segment).toHaveCSS("box-shadow", "none");
  await pointerControls.toggle.click();
  await expect(pointerControls.switchTrack).toHaveCSS("box-shadow", "none");
});

test("the CSS glow composes with a kanban card's elevation shadow", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=kanban-examples--clickable-cards&viewMode=story",
  );
  const card = page.getByRole("button", {
    name: /How scoped agents stay fully auditable/,
  });
  await focusWithKeyboard(page, card);
  const shadow = await card.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  expect(shadow).toContain(DEFAULT_GLOW);
  expect(shadow).toContain("inset");
  expect(shadow).toContain("rgba(20, 28, 22, 0.05)");
});

test("wheel date trigger paints its frame around the focused button", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=date-examples--wheel-date-field&viewMode=story",
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });

  const trigger = page.getByRole("button", { name: "Year ends: 31 Mar 2026" });
  const host = page
    .locator('[data-firna-focus-host="descendant"]')
    .filter({ has: trigger });

  await focusWithKeyboard(page, trigger);
  await expectGlow(host);
  await expect(trigger).toHaveCSS("outline-style", "none");
  await expect(host).toHaveAttribute("tabindex", "-1");
});

test("nested field actions keep their own outline instead of the frame glow", async ({
  page,
}) => {
  // A clear or chip-remove button lives inside the frame CSS decorates. Its
  // focus must not light the whole field (that would say "the field is
  // focused" while Enter would actually clear it), and it must keep the
  // browser outline so the focused action is still visible (WCAG 2.4.7).
  await page.goto("/iframe.html?id=input-examples--clearable-field");
  const input = page.getByLabel("Search", { exact: true });
  const clear = page.getByRole("button", { name: "Clear Search" });
  const frame = page
    .locator('[data-firna-focus-host="descendant"]')
    .filter({ has: input });

  await focusWithKeyboard(page, input);
  await expectGlow(frame);
  await page.keyboard.press("Tab");
  await expect(clear).toBeFocused();
  await expect(frame).toHaveCSS("box-shadow", "none");
  await expect(frame).toHaveCSS("outline-style", "none");
  await expectBrowserOutline(clear);

  await page.goto(
    "/iframe.html?id=dropdown-examples--chip-multi-select&viewMode=story",
  );
  const remove = page.getByRole("button", { name: "Remove Greenhouse Studio" });
  const control = page
    .locator('[data-firna-focus-host="descendant"]')
    .filter({ has: remove });
  await focusWithKeyboard(page, remove);
  await expect(control).toHaveCSS("box-shadow", "none");
  await expect(control).toHaveCSS("outline-style", "none");
  await expectBrowserOutline(remove);

  await page.goto(
    "/iframe.html?id=date-examples--clearable-wheel-date-field&viewMode=story",
  );
  const clearDate = page.getByRole("button", { name: "Clear Year ends" });
  const trigger = page
    .locator('[data-firna-focus-host="descendant"]')
    .filter({ has: clearDate });
  await focusWithKeyboard(page, clearDate);
  await expect(trigger).toHaveCSS("box-shadow", "none");
  await expect(trigger).toHaveCSS("outline-style", "none");
  await expectBrowserOutline(clearDate);
});

test("a raw DOM control painted through focusRingDomProps gets the glow", async ({
  page,
}) => {
  await gotoFocusRingStory(page, "raw-dom-control");
  const swatch = page.getByRole("button", { name: "Sage swatch" });
  const frame = page.getByRole("group", { name: "Raw DOM field" });
  const field = page.getByRole("textbox", { name: "Raw DOM field" });

  await focusWithKeyboard(page, swatch);
  await expectGlow(swatch);
  await expect(swatch).toHaveAttribute("data-firna-focus-ring", "self");

  await focusWithKeyboard(page, field);
  await expectGlow(frame);
  await expect(field).toHaveCSS("outline-style", "none");
  await expect(frame).toHaveAttribute("data-firna-focus-host", "descendant");
  await expect(field).toHaveAttribute("data-firna-focus-target", "true");
});

test("the theme provider injects the stylesheet on a page with no primitive", async ({
  page,
}) => {
  // Only View, Text, and TextInput used to inject `domBackendCss`, so a page
  // built from the provider and raw DOM controls alone carried the markers but
  // no rules to read them. The provider now injects on the client too.
  await gotoFocusRingStory(page, "raw-dom-only-page");
  const primitives = page.locator(
    `.${VIEW_CLASS}, .${TEXT_CLASS}, .${TEXT_INPUT_CLASS}`,
  );
  await expect(primitives).toHaveCount(0);
  const sheet = page.locator(`head > style#${DOM_BACKEND_STYLE_ID}`);
  await expect(sheet).toHaveCount(1);

  const swatch = page.getByRole("button", { name: "Sage swatch" });
  const frame = page.getByRole("group", { name: "Raw DOM field" });
  const field = page.getByRole("textbox", { name: "Raw DOM field" });
  await focusWithKeyboard(page, swatch);
  await expectGlow(swatch);
  await focusWithKeyboard(page, field);
  await expectGlow(frame);
  await expect(field).toHaveCSS("outline-style", "none");
});

for (const [label, storyId] of [
  ["theme focusRing false", "ring-disabled-globally"],
  ["disableFocusRing", "ring-disabled-per-control"],
] as const) {
  test(`${label} restores the browser outline on each visible box`, async ({
    page,
  }) => {
    await gotoFocusRingStory(page, storyId);
    const controls = focusRingControls(page);

    await focusWithKeyboard(page, controls.button);
    await expectBrowserOutline(controls.button);
    await expect(controls.button).not.toHaveAttribute("data-firna-focus-ring");

    await focusWithKeyboard(page, controls.input);
    await expectBrowserOutline(controls.inputFrame);
    await expect(controls.input).toHaveCSS("outline-style", "none");

    await focusWithKeyboard(page, controls.segment);
    await expectBrowserOutline(controls.segment);

    await focusWithKeyboard(page, controls.toggle);
    await expectBrowserOutline(controls.switchTrack);
    await expect(controls.toggle).toHaveCSS("outline-style", "none");
  });
}

test("static HTML paints the same ring with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <style>${domBackendCss}</style>
    <main style="--firna-focus-ring-color:${DEFAULT_GLOW};--firna-focus-ring-width:4px">
      <button data-firna-focus-ring="self" style="--firna-focus-ring-base-shadow:0 1px 2px rgb(1, 2, 3)">Button</button>
      <div data-firna-focus-host="descendant" data-firna-focus-ring="descendant">
        <input aria-label="Input" data-firna-focus-target="true" />
        <button aria-label="Clear Input">x</button>
      </div>
      <button role="radio" data-firna-focus-ring="self" data-firna-focus-ring-inset="true">Segment</button>
      <button role="switch" data-firna-focus-target="true"><span data-firna-focus-ring="parent"></span></button>
      <button data-firna-focus-ring="self" data-firna-focus-ring-inset="true">List item</button>
    </main>`);

  const stops = [
    { painted: page.getByRole("button", { name: "Button" }) },
    {
      painted: page.locator('[data-firna-focus-ring="descendant"]'),
      target: page.getByRole("textbox", { name: "Input" }),
    },
    {
      // An unmarked action inside the frame keeps its own browser outline and
      // leaves the frame unlit, even with no JavaScript to intervene.
      painted: page.getByRole("button", { name: "Clear Input" }),
      browserOutline: true,
      unlit: page.locator('[data-firna-focus-ring="descendant"]'),
    },
    { painted: page.getByRole("radio", { name: "Segment" }), inset: true },
    {
      painted: page.locator('[data-firna-focus-ring="parent"]'),
      target: page.getByRole("switch"),
    },
    {
      painted: page.getByRole("button", { name: "List item" }),
      inset: true,
    },
  ];

  for (const stop of stops) {
    await page.keyboard.press("Tab");
    if (stop.target) await expect(stop.target).toBeFocused();
    else await expect(stop.painted).toBeFocused();
    if (stop.browserOutline) {
      await expectBrowserOutline(stop.painted);
      await expect(stop.unlit).toHaveCSS("box-shadow", "none");
      continue;
    }
    await expectGlow(stop.painted, stop.inset);
  }
  expect(
    await page
      .getByRole("button", { name: "Button" })
      .evaluate((element) => getComputedStyle(element).boxShadow),
  ).toContain("rgb(1, 2, 3)");
  await expect(page.getByRole("textbox", { name: "Input" })).toHaveCSS(
    "outline-style",
    "none",
  );
  const last = page.getByRole("button", { name: "List item" });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(last).toHaveCSS("box-shadow", "none");
  await expect(last).toHaveCSS("outline-style", "solid");
  await expect(last).toHaveCSS("outline-width", "2px");
  await context.close();
});
