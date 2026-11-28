import { expect, test } from "@playwright/test";

import { boxOfLocator } from "./dragSelectHelpers";
import { expectGlow, focusWithKeyboard } from "./focusRingHelpers";
import { bundleRnwFixture, openRnwFixture } from "./rnw/harness";

test("Firna renders links, focus, and live regions on React Native Web", async ({
  page,
}) => {
  const {
    metafile,
    outputFiles: [script],
  } = await bundleRnwFixture();
  await openRnwFixture(page, script.text);
  const list = page.getByRole("list", { name: "Projects" });
  await expect(list).toBeVisible();

  await test.step("the bundle draws with React Native Web", async () => {
    const domModules = Object.keys(metafile.inputs).filter((path) =>
      /(?:^|\/)primitives\/dom\//.test(path.replaceAll("\\", "/")),
    );
    expect(domModules, "DOM backend files in the RNW bundle").toEqual([]);
    await expect(page.locator("style#react-native-stylesheet")).toHaveCount(1);
  });

  await test.step("list anchors run app navigation on a plain click and Enter", async () => {
    const startUrl = page.url();
    const navigations = page.getByText(/^Navigations:/);
    const overview = list.getByRole("link", { name: "Overview", exact: true });
    const help = list.getByRole("link", {
      name: "Project help (opens in a new tab)",
      exact: true,
    });
    await expect(overview).toHaveJSProperty("tagName", "A");
    await expect(overview).toHaveAttribute("href", "#overview");
    await expect(overview).toHaveAttribute("aria-current", "page");
    await expect(help).toHaveAttribute("target", "_blank");
    await expect(help).toHaveAttribute("rel", "noopener noreferrer");
    await expect(help.locator("svg")).toBeVisible();

    await overview.click();
    await expect(navigations).toHaveText("Navigations: 1");
    await expect(page).toHaveURL(startUrl);

    await overview.focus();
    await expect(overview).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(navigations).toHaveText("Navigations: 2");
    await expect(page).toHaveURL(startUrl);

    await page.keyboard.press("Space");
    await expect(navigations, "Space on the link").toHaveText("Navigations: 2");
    await overview.click();
    await expect(navigations).toHaveText("Navigations: 3");

    for (const [modifier, before, after] of [
      ["Control", 3, 4],
      ["Meta", 4, 5],
    ] as const) {
      await overview.click({ modifiers: [modifier] });
      await expect(navigations, `${modifier} click on the link`).toHaveText(
        `Navigations: ${before}`,
      );
      await overview.click();
      await expect(navigations).toHaveText(`Navigations: ${after}`);
    }

    await help.click();
    await expect(navigations, "click on the new-tab link").toHaveText(
      "Navigations: 5",
    );
    await overview.click();
    await expect(navigations).toHaveText("Navigations: 6");
  });

  await test.step("keyboard focus glows without a theme provider", async () => {
    const button = page.getByRole("button", { name: "Save" });
    await expect(page.locator("head > style#firna-ui-dom-backend")).toHaveCount(
      1,
    );
    await expect(button).toHaveAttribute("data-firna-focus-ring", "self");
    await focusWithKeyboard(page, button);
    await expectGlow(button);
  });

  await test.step("the body-level toast regions announce the whole message", async () => {
    const overlay = page.locator("body > div[data-firna-live-overlay]");
    for (const priority of ["polite", "assertive"]) {
      await expect(
        overlay.locator(`div[aria-live="${priority}"]`),
      ).toHaveAttribute("aria-atomic", "true");
    }
  });
});

test("a Firna scrubber and an RNW button respond only to their own gestures", async ({
  page,
}) => {
  const {
    outputFiles: [script],
  } = await bundleRnwFixture("mixedResponderFixture.jsx", "dom");
  await openRnwFixture(page, script.text);
  const scrubber = page.getByRole("slider", { name: "Video position" });
  const button = page.getByRole("button", { name: "App button" });
  const pressStarts = page.getByText(/^App press starts:/);
  await expect(scrubber).toHaveAttribute("aria-valuenow", "0");
  await expect(pressStarts).toHaveText("App press starts: 0");

  await test.step("pressing the RNW button leaves the scrubber in place", async () => {
    await button.hover();
    await page.mouse.down();
    await expect(pressStarts).toHaveText("App press starts: 1");
    await expect(scrubber).toHaveAttribute("aria-valuenow", "0");
    await page.mouse.up();
    await expect(scrubber).toHaveAttribute("aria-valuenow", "0");
  });

  await test.step("dragging the scrubber leaves the RNW button at rest", async () => {
    const { x, y, width, height } = await boxOfLocator(scrubber);
    const centerY = y + height / 2;
    await page.mouse.move(x + width / 4, centerY);
    await page.mouse.down();
    await expect(scrubber).toHaveAttribute("aria-valuenow", "25");
    await page.mouse.move(x + (3 * width) / 4, centerY);
    await expect(scrubber).toHaveAttribute("aria-valuenow", "75");
    await page.mouse.up();
    await expect(pressStarts).toHaveText("App press starts: 1");
  });
});
