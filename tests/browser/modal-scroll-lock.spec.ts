import { expect, test, type Locator, type Page } from "@playwright/test";

import { storyControls } from "./modalStackHelpers";

/**
 * Page scroll lock under web dialogs, on the "Stacked web modals" story, whose
 * page scrolls. Headless Chromium hides its scrollbars by default, so the
 * gutter would be zero and the layout-shift check would prove nothing. This
 * file launches Chromium with its scrollbars and checks the gutter before a
 * dialog opens.
 */

/**
 * The page's window as this file uses it to pass a wheel result from one
 * `page.evaluate` call to the next.
 */
type WheelProbe = {
  /** The page scroll two frames after the next wheel event reaches the page. */
  firnaScrollAfterWheel?: Promise<number>;
};

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

const STACKED_STORY = "/iframe.html?id=modal-examples--stacked-web-modals";

/** A point over the backdrop, clear of the centered dialog surfaces. */
const BACKDROP_POINT = { x: 24, y: 24 };

/** Hidden page overflow on both elements, which the lock needs for iOS Safari. */
const LOCKED = { bodyOverflow: "hidden", rootOverflow: "hidden" };

/**
 * The computed `overflow` of the root element and the body, and the inline
 * values of the properties that the lock writes. Only those properties count,
 * because other code, such as a Storybook addon, writes other inline styles.
 */
function pageScrollState(page: Page) {
  return page.evaluate(() => {
    const { body, documentElement: root } = document;
    return {
      bodyOverflow: getComputedStyle(body).overflow,
      inline: {
        bodyOverflowX: body.style.getPropertyValue("overflow-x"),
        bodyOverflowY: body.style.getPropertyValue("overflow-y"),
        bodyPaddingRight: body.style.getPropertyValue("padding-right"),
        rootOverflowX: root.style.getPropertyValue("overflow-x"),
        rootOverflowY: root.style.getPropertyValue("overflow-y"),
      },
      rootOverflow: getComputedStyle(root).overflow,
    };
  });
}

/** The element's left offset in the viewport. */
function leftOffset(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().left);
}

/**
 * Wheels over a point and reads the page scroll two animation frames after the
 * wheel event reaches the page. Chromium applies a wheel scroll within those
 * frames, which the unlocked control in the wheel test confirms, so the read
 * needs no timer.
 */
async function scrollAfterWheel(
  page: Page,
  point: { x: number; y: number },
): Promise<number> {
  await page.mouse.move(point.x, point.y);
  await page.evaluate(() => {
    const probe = window as unknown as WheelProbe;
    probe.firnaScrollAfterWheel = new Promise((resolve) => {
      const settle = () =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(window.scrollY)),
        );
      window.addEventListener("wheel", settle, {
        capture: true,
        once: true,
        passive: true,
      });
    });
  });
  await page.mouse.wheel(0, 400);
  return page.evaluate(
    () =>
      (window as unknown as WheelProbe).firnaScrollAfterWheel ??
      Promise.resolve(Number.NaN),
  );
}

/** Loads the scrollable story and checks that its scrollbar takes real width. */
async function openScrollablePage(page: Page) {
  const ui = storyControls(page);
  await page.goto(STACKED_STORY);
  await expect(ui.manageAccount).toBeVisible();
  const gutter = await page.evaluate(
    () => window.innerWidth - document.documentElement.clientWidth,
  );
  expect(gutter, "the page shows a real scrollbar").toBeGreaterThan(0);
  return ui;
}

test("the page stays locked while dialogs stack and unlocks after the last one closes", async ({
  page,
}) => {
  const ui = await openScrollablePage(page);
  const unlocked = await pageScrollState(page);
  await ui.manageAccount.click();
  await expect
    .poll(() => pageScrollState(page), { message: "a dialog locks the page" })
    .toMatchObject(LOCKED);
  await ui.deleteAccount.click();
  await expect(ui.confirm).toBeVisible();
  await expect
    .poll(() => pageScrollState(page), { message: "a second dialog keeps it" })
    .toMatchObject(LOCKED);
  await page.keyboard.press("Escape");
  await expect(ui.confirm).toBeHidden();
  await expect
    .poll(() => pageScrollState(page), { message: "the lower dialog keeps it" })
    .toMatchObject(LOCKED);
  await page.keyboard.press("Escape");
  await expect(ui.settings).toBeHidden();
  await expect
    .poll(() => pageScrollState(page), {
      message: "the last close restores every inline style",
    })
    .toEqual(unlocked);
});

test("a fixed-width page element keeps its left offset when a dialog opens", async ({
  page,
}) => {
  const ui = await openScrollablePage(page);
  const activity = page.getByRole("list", {
    includeHidden: true,
    name: "Recent activity",
  });
  const left = await leftOffset(activity);
  await ui.manageAccount.click();
  await expect
    .poll(() => pageScrollState(page), { message: "a dialog locks the page" })
    .toMatchObject(LOCKED);
  await expect
    .poll(() => leftOffset(activity), {
      message: "removing the scrollbar does not shift the page",
    })
    .toBeCloseTo(left, 1);
});

test("a wheel over the backdrop does not scroll the page", async ({ page }) => {
  const ui = await openScrollablePage(page);
  await ui.manageAccount.click();
  await expect
    .poll(() => pageScrollState(page), { message: "a dialog locks the page" })
    .toMatchObject(LOCKED);
  expect(
    await scrollAfterWheel(page, BACKDROP_POINT),
    "a wheel under a dialog leaves the page in place",
  ).toBe(0);
  await page.keyboard.press("Escape");
  await expect(ui.settings).toBeHidden();
  expect(
    await scrollAfterWheel(page, BACKDROP_POINT),
    "the same wheel scrolls the page once it is unlocked",
  ).toBeGreaterThan(0);
});
