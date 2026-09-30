/** Shared helpers for the focus-ring and focus-indicator browser specs. */
import { expect, type Locator, type Page } from "@playwright/test";

/** The default theme's glow color at the standard alpha. */
export const DEFAULT_GLOW = "rgba(79, 120, 100, 0.35)";

/** How long a story may take to mount on a cold dev server. */
export const storyReadyTimeout = 30_000;

/** Opens one Focus ring/Examples story and waits for it to mount. */
export async function gotoFocusRingStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=focus-ring-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

/** Focuses `target` and switches to keyboard modality so `:focus-visible` matches. */
export async function focusWithKeyboard(page: Page, target: Locator) {
  await target.focus();
  await page.keyboard.press("Shift");
  await expect
    .poll(() => target.evaluate((element) => element.matches(":focus-visible")))
    .toBe(true);
}

/** The shared glow, outset or inset, with the browser outline hidden. */
export async function expectGlow(target: Locator, inset = false) {
  await expect(target).toHaveCSS("outline-style", "none");
  const shadow = await target.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  expect(shadow).toContain(DEFAULT_GLOW);
  expect(shadow).toContain("0px 0px 0px 4px");
  expect(shadow.includes("inset")).toBe(inset);
}

/** No glow; the browser's own outline instead. */
export async function expectBrowserOutline(target: Locator) {
  await expect(target).toHaveCSS("box-shadow", "none");
  expect(
    await target.evaluate(
      (element) => getComputedStyle(element).outlineStyle !== "none",
    ),
  ).toBe(true);
}

/** No glow and no outline: `focusIndicator="none"` paints nothing at all. */
export async function expectNoIndicator(...targets: Locator[]) {
  for (const target of targets) {
    await expect(target).toHaveCSS("box-shadow", "none");
    await expect(target).toHaveCSS("outline-style", "none");
  }
}

/** The Focus ring/Examples control row: one control per focus target shape. */
export function focusRingControls(page: Page) {
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
