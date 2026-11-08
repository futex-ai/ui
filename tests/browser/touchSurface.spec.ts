/**
 * Browser coverage for touch surfaces. Inside a `TouchSurface` every library
 * target is at least 44 by 44px, whatever the size that the caller gives, and
 * a control drawn smaller reserves its own target instead of an overlapping
 * hit area. Only a real layout can show the sizes, so these checks measure the
 * Touch surface stories.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoTouchStory(page: Page, storyId: string) {
  await page.goto(
    `/iframe.html?id=touch-surface-examples--${storyId}&viewMode=story`,
  );
}

/** Waits for the target to lay out at `height`, then returns its box. */
async function expectHeight(target: Locator, name: string, height: number) {
  await expect(target, name).toBeVisible();
  await expect
    .poll(async () => (await target.boundingBox())?.height, {
      message: `${name} height`,
    })
    .toBeCloseTo(height, 0);
  const box = await target.boundingBox();
  expect(box, name).not.toBeNull();
  return box!;
}

type Target = { name: string; target: (page: Page) => Locator };

/** Targets with a width of their own, such as a label or a field. */
const lineTargets: (Target & { height: number })[] = [
  {
    height: 44,
    name: "labelled button",
    target: (page) => page.getByRole("button", { name: "Save" }),
  },
  {
    height: 44,
    name: "text input",
    target: (page) => page.getByRole("textbox", { name: "Search projects" }),
  },
  {
    // The selector trigger is the 46px field box, as wide as the field.
    height: 46,
    name: "selector",
    target: (page) =>
      page.getByRole("button", { name: "Environment, Production" }),
  },
  {
    height: 44,
    name: "date input",
    target: (page) => page.getByRole("textbox", { name: "Due date" }),
  },
  {
    // The tap trigger that native uses: its open button fills the 46px row.
    height: 44,
    name: "date tap trigger",
    target: (page) =>
      page.getByRole("button", { name: "Start date: 1 Apr 2026" }),
  },
  {
    height: 44,
    name: "pill segment",
    target: (page) => page.getByRole("radio", { name: "Board" }),
  },
  {
    height: 44,
    name: "outline segment",
    target: (page) => page.getByRole("radio", { name: "Week" }),
  },
  {
    height: 44,
    name: "chip input",
    target: (page) => page.getByRole("combobox", { name: "Labels" }),
  },
  {
    height: 44,
    name: "single-line chip input",
    target: (page) => page.getByRole("combobox", { name: "Reviewers" }),
  },
];

/** Targets that are 44 by 44px squares. */
const squareTargets: Target[] = [
  {
    name: "icon button",
    target: (page) => page.getByRole("button", { name: "Settings" }),
  },
  {
    name: "button with a 16px box",
    target: (page) => page.getByRole("button", { name: "Remove filter" }),
  },
  {
    name: "clear action",
    target: (page) =>
      page.getByRole("button", { name: "Clear Search projects" }),
  },
  {
    name: "suffix action",
    target: (page) => page.getByRole("button", { name: "Filter by tag" }),
  },
  {
    name: "date tap trigger clear action",
    target: (page) => page.getByRole("button", { name: "Clear Start date" }),
  },
  {
    name: "switch",
    target: (page) => page.getByRole("switch", { name: "Notifications" }),
  },
  {
    name: "chip removal",
    target: (page) => page.getByRole("button", { name: "Remove Design" }),
  },
];

test("every control on a touch surface is a target of at least 44 by 44 px", async ({
  page,
}) => {
  await gotoTouchStory(page, "controls");

  for (const { height, name, target } of lineTargets) {
    const box = await expectHeight(target(page), name, height);
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
  }
  for (const { name, target } of squareTargets) {
    const box = await expectHeight(target(page), name, 44);
    expect(box.width, `${name} width`).toBeCloseTo(44, 0);
  }

  // The option rows of the selector and chip multi-select popups are touch
  // rows too: at least 44px for one line.
  await page.getByRole("button", { name: "Environment, Production" }).click();
  await expectHeight(
    page.getByRole("option", { name: "Preview" }),
    "selector option",
    44,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Labels" }).click();
  const chipOption = page.getByRole("option", { name: "Mobile" });
  await expect(chipOption).toBeVisible();
  expect(
    (await chipOption.boundingBox())?.height ?? 0,
    "chip option height",
  ).toBeGreaterThanOrEqual(44);
});

test("a small button on a touch surface reserves its own target and takes no hit slop", async ({
  page,
}) => {
  await gotoTouchStory(page, "controls");
  const remove = page.getByRole("button", { name: "Remove filter" });
  const close = page.getByRole("button", { name: "Close panel" });
  const presses = page.getByText(/^Presses: /);
  await expect(presses).toHaveText("Presses: 0");

  // Each 16px face sits in a 44 by 44px target of its own.
  const first = await expectHeight(remove, "Remove filter", 44);
  const second = await expectHeight(close, "Close panel", 44);
  expect(first.width).toBeCloseTo(44, 0);
  expect(second.width).toBeCloseTo(44, 0);
  // The two reserved targets sit side by side, and neither overlaps the other.
  expect(first.x + first.width).toBeLessThanOrEqual(second.x + 0.5);

  // A press near the corner of the target, outside the 16px face, presses it.
  await page.mouse.click(first.x + 3, first.y + 3);
  await expect(presses).toHaveText("Presses: 1");

  // Below the target, inside the 14px hit slop that the button asks for, a
  // press does nothing: the next real press counts 2, not 3.
  await page.mouse.click(first.x + first.width / 2, first.y + first.height + 6);
  await close.click();
  await expect(presses).toHaveText("Presses: 2");
});

test("touch controls draw 15 px labels on a 20 px line and 16 px field text", async ({
  page,
}) => {
  await gotoTouchStory(page, "controls");

  for (const label of ["Save", "Week"]) {
    const text = page.getByText(label, { exact: true });
    await expect(text, label).toHaveCSS("font-size", "15px");
    await expect(text, label).toHaveCSS("line-height", "20px");
    await expect(text, label).toHaveCSS("font-weight", "500");
  }
  // 16px field text stops a phone browser from zooming into a focused field.
  await expect(
    page.getByRole("textbox", { name: "Search projects" }),
  ).toHaveCSS("font-size", "16px");
  await expect(page.getByText("Production", { exact: true })).toHaveCSS(
    "font-size",
    "16px",
  );
});

test("touch list rows are 44 px for one line and a pressable title spans its row", async ({
  page,
}) => {
  await gotoTouchStory(page, "rows");
  const single = page.getByRole("listitem").filter({ hasText: "Billing" });
  const long = page
    .getByRole("listitem")
    .filter({ hasText: "A project with a name long enough" });
  const title = page.getByRole("button", { name: "Deploys", exact: true });
  const row = page.getByRole("listitem").filter({ has: title });
  const pin = page.getByRole("switch", { name: "Pin Deploys" });

  await expectHeight(single, "single-line row", 44);
  // A longer row grows past the floor with its second line.
  const longBox = await long.boundingBox();
  expect(longBox?.height ?? 0).toBeGreaterThanOrEqual(44 + 20);
  // The pressable title is as high as its row, padding included.
  const titleBox = await title.boundingBox();
  const rowBox = await row.boundingBox();
  expect(titleBox?.height ?? 0).toBeCloseTo(rowBox?.height ?? -1, 0);
  const pinBox = await expectHeight(pin, "trailing switch", 44);
  expect(pinBox.width).toBeCloseTo(44, 0);

  // The trailing switch stays its own control: it does not open the row.
  await pin.click();
  await expect(page.getByText("Pinned: yes")).toBeVisible();
  await expect(page.getByText("Opened: none")).toBeVisible();
  await title.click();
  await expect(page.getByText("Opened: Deploys")).toBeVisible();
});
