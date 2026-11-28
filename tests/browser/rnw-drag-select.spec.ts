import { expect, test, type Locator, type Page } from "@playwright/test";

import { boxOfLocator } from "./dragSelectHelpers";
import { bundleRnwFixture, openRnwFixture } from "./rnw/harness";

const marquee = "[data-drag-select-marquee]";
const buttonPressed = "rgb(173, 193, 181)";
const buttonResting = "rgb(243, 246, 244)";
// The defaults in RNW's PressResponder and Firna's web press machine.
const pressInDelay = 50;
const longPressDelay = 450;

let script: string;
test.beforeAll(async () => {
  const { outputFiles } = await bundleRnwFixture("dragSelectFixture.jsx");
  script = outputFiles[0].text;
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(60_000);
  await openRnwFixture(page, script);
  await expect(page.locator("style#react-native-stylesheet")).toHaveCount(1);
});

async function dragFromButton(
  page: Page,
  rows: Locator,
  leaveProvider = false,
) {
  const button = rows.getByRole("button", { name: "Archive" });
  const events = rows.getByText(/^Button events:/);
  await expect(button).toBeVisible();
  const box = await boxOfLocator(button);
  const x = Math.floor(box.x + box.width - 2);
  const y = Math.floor(box.y + box.height / 2);
  // This step crosses the 4 px drag threshold and stays below the 10 px
  // movement that would cancel RNW's long press without a responder claim.
  const nextX = x + (leaveProvider ? 8 : -8);
  const nextY = y + 1;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.clock.runFor(pressInDelay);
  await expect(events).toHaveText("Button events: in");
  await expect(button).toHaveCSS("background-color", buttonPressed);

  await page.mouse.move(nextX, nextY);
  await expect(page.locator(marquee)).toBeVisible();
  const ended = `Button events: in, out:mousemove(${nextX}, ${nextY})`;
  await expect(events).toHaveText(ended);
  await expect(button).toHaveCSS("background-color", buttonResting);

  await page.clock.runFor(longPressDelay + 1);
  await expect(events).toHaveText(ended);
  await page.mouse.up();
  await expect(
    rows.getByRole("checkbox", { name: "Archive row" }),
  ).toBeChecked();
  await expect(events).toHaveText(ended);
}

test("an RNW drag ends the button press at the starting move", async ({
  page,
}) => {
  await dragFromButton(page, page.getByRole("group", { name: "Project rows" }));
});

test("an RNW drag ends the button press when a row stops the starting mousemove", async ({
  page,
}) => {
  await dragFromButton(
    page,
    page.getByRole("group", { name: "Rows that stop mouse moves" }),
  );
});

test("an RNW drag clears a link row's pressed look and swallows its click", async ({
  page,
}) => {
  const rows = page.getByRole("group", { name: "Project rows" });
  const link = rows.getByRole("link", { name: "Overview" });
  const navigations = rows.getByText(/^Navigations:/);
  await expect(link).toBeVisible();
  const box = await boxOfLocator(link);
  const x = Math.floor(box.x + box.width / 2);
  const y = Math.floor(box.y + box.height / 2);
  await page.mouse.move(x, y);
  await expect(link).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await page.mouse.down();
  await page.clock.runFor(pressInDelay);
  await expect(link).toHaveCSS("background-color", "rgb(236, 237, 231)");

  await page.mouse.move(x + 8, y + 1);
  await expect(page.locator(marquee)).toBeVisible();
  await expect(link).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await page.clock.runFor(longPressDelay + 1);
  await expect(link).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await page.mouse.up();
  await expect(
    rows.getByRole("checkbox", { name: "Overview row" }),
  ).toBeChecked();
  await expect(navigations).toHaveText("Navigations: 0");

  // The click-swallow listener retires on the next animation frame.
  await page.clock.runFor(16);
  await link.click();
  await expect(navigations).toHaveText("Navigations: 1");
});

test("an RNW drag inside a ScrollView ends the button press and selects its row", async ({
  page,
}) => {
  const scroller = page.getByTestId("rows-scroll-view");
  await expect
    .poll(() => scroller.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeGreaterThan(0);
  await dragFromButton(
    page,
    scroller.getByRole("group", { name: "Scrollable rows" }),
  );
});

test("an RNW drag ends the press when the starting move leaves the provider", async ({
  page,
}) => {
  await dragFromButton(
    page,
    page.getByRole("group", { name: "Project rows" }),
    true,
  );
});
