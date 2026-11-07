/**
 * Browser coverage for link buttons and link tabs: the browser's own link
 * behaviour beside the app's navigation, the look that a link shares with the
 * button of its tone and size, the tab landmark, and focus inside a scrolling
 * tab row. Each needs a real browser: new tabs, focus, and layout.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

import { expectGlow, focusWithKeyboard } from "./focusRingHelpers";

const storyReadyTimeout = 30_000;

async function gotoLinkStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=link-examples--${storyId}&viewMode=story`);
  await page.waitForSelector("#storybook-root *", {
    timeout: storyReadyTimeout,
  });
}

/** The computed look of a control box and its label text. */
async function paintOf(control: Locator, label: string) {
  const box = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      height: element.getBoundingClientRect().height,
      paddingLeft: style.paddingLeft,
      radius: style.borderTopLeftRadius,
    };
  });
  const text = await control.getByText(label).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
    };
  });
  return { ...box, ...text };
}

test("a plain click and Enter run the app's navigation, and other clicks keep the browser's link behaviour", async ({
  context,
  page,
}) => {
  await context.route("https://help.example.com/**", (route) =>
    route.fulfill({ body: "<p>Help</p>", contentType: "text/html" }),
  );
  await gotoLinkStory(page, "link-buttons");
  const storyUrl = page.url();
  const log = page.getByText(/^Navigations:/);
  const activity = page.getByRole("link", { name: "All activity" });
  await expect(activity).toHaveAttribute("href", "/atlas/activity");

  // A plain click runs the app's navigation and loads nothing.
  await activity.click();
  await expect(log).toHaveText("Navigations: /atlas/activity");
  await expect(page).toHaveURL(storyUrl);

  // A Ctrl-click and a middle click open the address in a new tab.
  const [controlTab] = await Promise.all([
    context.waitForEvent("page"),
    activity.click({ modifiers: ["Control"] }),
  ]);
  await expect(controlTab).toHaveURL(/\/atlas\/activity$/);
  const [middleTab] = await Promise.all([
    context.waitForEvent("page"),
    activity.click({ button: "middle" }),
  ]);
  await expect(middleTab).toHaveURL(/\/atlas\/activity$/);

  // A new-tab link opens its page, which gets no access to this one.
  const help = page.getByRole("link", {
    name: "Help center (opens in a new tab)",
  });
  await expect(help).toHaveAttribute("target", "_blank");
  const [helpTab] = await Promise.all([
    context.waitForEvent("page"),
    help.click(),
  ]);
  await expect(helpTab).toHaveURL("https://help.example.com/deploys");
  expect(await helpTab.evaluate(() => window.opener)).toBeNull();

  // Space does not activate a link, and Enter runs the app's navigation. The
  // log proves that none of the clicks above ran it.
  const primary = page.getByRole("link", { name: "Open primary" });
  await primary.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expect(log).toHaveText("Navigations: /atlas/activity, /atlas/primary");
  await expect(page).toHaveURL(storyUrl);

  // Keyboard focus shows the shared glow; a pointer click shows none.
  await focusWithKeyboard(page, activity);
  await expectGlow(activity);
  await page.getByRole("link", { name: "Open secondary" }).click();
  await expect(page.getByRole("link", { name: "Open secondary" })).toHaveCSS(
    "box-shadow",
    "none",
  );
});

test("a link button has the box and label of the button of the same tone and size", async ({
  page,
}) => {
  await gotoLinkStory(page, "beside-buttons");
  for (const size of ["xs", "md"]) {
    for (const tone of ["primary", "secondary", "ghost", "plain"]) {
      const buttonLabel = `Button ${tone} ${size}`;
      const linkLabel = `Link ${tone} ${size}`;
      const button = page.getByRole("button", { name: buttonLabel });
      const link = page.getByRole("link", { name: linkLabel });
      expect(await paintOf(link, linkLabel), `${tone} ${size} at rest`).toEqual(
        await paintOf(button, buttonLabel),
      );
      await button.hover();
      const buttonHover = await paintOf(button, buttonLabel);
      await link.hover();
      expect(await paintOf(link, linkLabel), `${tone} ${size} hovered`).toEqual(
        buttonHover,
      );
    }
  }
  // The dense size: a 26 px box with a 12 px label on a 16 px line at 500.
  const dense = await paintOf(
    page.getByRole("link", { name: "Link secondary xs" }),
    "Link secondary xs",
  );
  expect([
    dense.height,
    dense.fontSize,
    dense.lineHeight,
    dense.fontWeight,
  ]).toEqual([26, "12px", "16px", "500"]);
});

test("link tabs are a named navigation of links with the current page marked and button-height tabs", async ({
  page,
}) => {
  await gotoLinkStory(page, "tabs");
  const project = page.getByRole("navigation", { name: "Project" });
  await expect(project.getByRole("link")).toHaveCount(5);
  const files = project.getByRole("link", { name: "Files 43" });
  const activity = project.getByRole("link", { name: "Activity" });
  await expect(files).toHaveAttribute("aria-current", "page");
  await expect(activity).not.toHaveAttribute("aria-current");

  // The current tab changes its fill, outline, and text colour, not its
  // label weight.
  const current = await paintOf(files, "Files");
  const other = await paintOf(activity, "Activity");
  expect(current.fontWeight).toBe(other.fontWeight);
  expect(current.background).not.toBe(other.background);
  expect(current.border).not.toBe(other.border);
  expect(current.color).not.toBe(other.color);

  // Every tab has the height of a button of its size, restyled labels too.
  for (const [name, height] of [
    ["Project", 26],
    ["Workspace", 26],
    ["Sections", 38],
  ] as const) {
    for (const tab of await page
      .getByRole("navigation", { name })
      .getByRole("link")
      .all()) {
      expect((await tab.boundingBox())?.height, `${name} tab`).toBe(height);
    }
  }
  const status = page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Status (opens in a new tab)" });
  await expect(status).toHaveAttribute("target", "_blank");
  await expect(status.getByText("Status")).toHaveCSS(
    "text-transform",
    "uppercase",
  );

  // A tab runs the app's navigation with its own destination.
  await activity.click();
  await expect(page.getByText(/^Navigations:/)).toHaveText(
    "Navigations: /atlas/activity",
  );
});

/** The room between a focused tab and each edge of the row that scrolls it. */
async function roomInRow(tab: Locator) {
  return tab.evaluate((element) => {
    let row = element.parentElement;
    while (row != null && getComputedStyle(row).overflowX === "visible") {
      row = row.parentElement;
    }
    const box = element.getBoundingClientRect();
    const frame = (row ?? element).getBoundingClientRect();
    return {
      bottom: frame.bottom - box.bottom,
      left: box.left - frame.left,
      right: frame.right - box.right,
      top: box.top - frame.top,
    };
  });
}

test("each focused tab and its glow stay inside a scrolling tab row", async ({
  page,
}) => {
  await gotoLinkStory(page, "tabs");
  const project = page.getByRole("navigation", { name: "Project" });
  const names = ["Overview", "Files 43", "Activity", "Deployments", "Settings"];
  const tab = (name: string) => project.getByRole("link", { name });
  await focusWithKeyboard(page, tab(names[0]));
  await expectGlow(tab(names[0]));
  const visit = async (name: string) => {
    await expect(tab(name)).toBeFocused();
    const room = await roomInRow(tab(name));
    for (const [edge, value] of Object.entries(room)) {
      expect(value, `${name} ${edge}`).toBeGreaterThanOrEqual(4);
    }
  };
  await visit(names[0]);
  for (const name of names.slice(1)) {
    await page.keyboard.press("Tab");
    await visit(name);
  }
  for (const name of names.slice(0, -1).reverse()) {
    await page.keyboard.press("Shift+Tab");
    await visit(name);
  }
});

test("on a touch surface, link buttons and tabs are 44 px targets, and a filled bar shares its width", async ({
  page,
}) => {
  await gotoLinkStory(page, "touch-surface-links");
  const back = await page.getByRole("link", { name: "Projects" }).boundingBox();
  expect([back?.width, back?.height]).toEqual([44, 44]);
  const activity = page.getByRole("link", { name: "All activity" });
  const label = await paintOf(activity, "All activity");
  expect([label.height, label.fontSize, label.fontWeight]).toEqual([
    44,
    "15px",
    "500",
  ]);

  // The filled bar: 44 px tabs that span the bar, 4 px apart, and show every
  // label in full.
  const bar = page.getByRole("navigation", { name: "Project" });
  await expect(bar.getByRole("link")).toHaveCount(4);
  let spanned = 0;
  for (const [name, text] of [
    ["Overview", "Overview"],
    ["Files 43", "Files"],
    ["Activity", "Activity"],
    ["Settings", "Settings"],
  ]) {
    const tab = bar.getByRole("link", { name });
    const box = await tab.boundingBox();
    expect(box?.height).toBe(44);
    spanned += box?.width ?? 0;
    const cut = await tab
      .getByText(text, { exact: true })
      .evaluate((label) => label.scrollWidth > label.clientWidth);
    expect(cut, `${text} is cut`).toBe(false);
  }
  const barBox = await bar.boundingBox();
  expect(spanned + 3 * 4).toBeCloseTo(barBox?.width ?? 0, 0);

  // A narrow filled bar with more tabs than fit keeps every 44 px target and
  // scrolls instead; keyboard focus brings the last tab fully into view.
  const quarters = page.getByRole("navigation", { name: "Quarter" });
  for (const name of ["Q1", "Q2", "Q3", "Q4", "Year", "Archive"]) {
    const box = await quarters.getByRole("link", { name }).boundingBox();
    expect(box?.width ?? 0, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box?.height, `${name} height`).toBe(44);
  }
  const archive = quarters.getByRole("link", { name: "Archive" });
  await focusWithKeyboard(page, archive);
  const room = await roomInRow(archive);
  expect(room.left).toBeGreaterThanOrEqual(4);
  expect(room.right).toBeGreaterThanOrEqual(4);
});
