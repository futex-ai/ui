/**
 * Behaviour on a real button that a source assertion cannot prove: that the
 * hit slop actually presses, that the visible box really is smaller than any
 * control density, and that a trigger's popup semantics reach the DOM.
 */
import { expect, test, type Page } from "@playwright/test";

const storyReadyTimeout = 30_000;

async function gotoButtonStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=button-examples--${storyId}&viewMode=story`);
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

async function gotoFocusRingStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=focus-ring-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

test("the custom ring follows focus-visible input modality", async ({
  page,
}) => {
  await gotoButtonStory(page, "tones");
  const primary = page.getByRole("button", { name: "Primary" });
  const secondary = page.getByRole("button", { name: "Secondary" });

  await primary.click();
  await expect(primary).toBeFocused();
  expect(
    await primary.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(false);
  await expect(primary).toHaveCSS("box-shadow", "none");

  await page.keyboard.press("Space");
  expect(
    await primary.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  expect(
    await primary.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toBe("none");

  await page.keyboard.press("Tab");
  await expect(secondary).toBeFocused();
  expect(
    await secondary.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  expect(
    await secondary.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toBe("none");
});

test("disabling a focused button cannot leave a stale ring", async ({
  page,
}) => {
  await gotoFocusRingStory(page, "dynamic-disabled");
  const exportButton = page.getByRole("button", {
    exact: true,
    name: "Export",
  });
  const finishButton = page.getByRole("button", { name: "Finish export" });
  const searchButton = page.getByRole("button", { name: "Search" });

  await exportButton.click();
  await expect(exportButton).toBeDisabled();
  expect(
    await page.evaluate(() => document.activeElement === document.body),
  ).toBe(true);
  await expect(exportButton).toHaveCSS("box-shadow", "none");

  await finishButton.dispatchEvent("click");
  await expect(exportButton).toBeEnabled();
  expect(
    await page.evaluate(() => document.activeElement === document.body),
  ).toBe(true);
  await expect(exportButton).toHaveCSS("box-shadow", "none");

  await searchButton.click();
  await expect(searchButton).toBeFocused();
  await expect(exportButton).toHaveCSS("box-shadow", "none");
});

test("hit slop presses the button from outside its visible box", async ({
  page,
}) => {
  await gotoButtonStory(page, "tap-target");
  const remove = page.getByRole("button", { name: "Remove tag" });
  const readout = page.getByText(/^presses: /);

  // `boxSize` really does go below the smallest density's 30px track: this is
  // the case `minTouchTarget` could not express, since it is a floor only.
  const box = (await remove.boundingBox())!;
  expect(box.width).toBeCloseTo(16, 0);
  expect(box.height).toBeCloseTo(16, 0);
  await expect(readout).toHaveText("presses: 0");

  // 10px to the left of the visible edge is outside the box and inside the
  // 14px slop. react-native-web's Pressable ignores `hitSlop` entirely, so
  // without the expander this click lands on the surface and nothing happens.
  await page.mouse.click(box.x - 10, box.y + box.height / 2);
  await expect(readout).toHaveText("presses: 1");

  // Below the visible edge too — the slop is not one-sided.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height + 10);
  await expect(readout).toHaveText("presses: 2");

  // And past the slop it stops: 20px out is beyond the 14px expansion, so the
  // expander is a bounded area rather than a swallow-everything overlay.
  await page.mouse.click(box.x - 20, box.y + box.height / 2);
  await expect(readout).toHaveText("presses: 2");
});

test("a menu trigger announces what it opens and whether it is open", async ({
  page,
}) => {
  await gotoButtonStory(page, "menu-trigger");
  const trigger = page.getByRole("button", { name: "Actions" });

  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // Still a trigger after opening — `aria-haspopup` describes the control, not
  // the current state.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
});

test("the press lifecycle reports the hold, not just the tap", async ({
  page,
}) => {
  await gotoButtonStory(page, "press-lifecycle");
  const talk = page.getByRole("button", { name: "Hold to talk" });
  const readout = page.getByText(/^(idle|recording|held)$/);

  await expect(readout).toHaveText("idle");

  // Press-in and press-out are separate events, which is the whole point for a
  // push-to-talk control: the press has a duration, not just a moment.
  const box = (await talk.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(readout).toHaveText("recording");
  await page.mouse.up();
  await expect(readout).toHaveText("idle");
});
