import { expect, test, type Page } from "@playwright/test";

test("dropdown selector opens, navigates with keyboard, and closes outside", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-selector-default",
  );

  await page.getByRole("button", { name: "Scheme, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Scheme, Cash accounting" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Scheme, Cash accounting" }).click();
  await expect(page.getByText("Flat rate")).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByText("Flat rate")).toBeHidden();
});

test("dropdown action menu opens from child trigger and closes after selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  const trigger = page.getByRole("button", { name: "Open action menu" });
  // The trigger advertises its popup to assistive tech in every mode.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  await expect(settings).toBeVisible();
  await expect(
    page.getByRole("menuitem", { exact: true, name: "Remove" }),
  ).toBeVisible();

  await settings.click();
  await expect(page.getByText("Last action: Settings")).toBeVisible();
  await expect(settings).toBeHidden();
});

test("dropdown action menu preselects first row and tracks hover selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-action-menu");

  await page.getByRole("button", { name: "Open action menu" }).click();

  const settings = page.getByRole("menuitem", {
    exact: true,
    name: "Settings",
  });
  const remove = page.getByRole("menuitem", { exact: true, name: "Remove" });
  await expect(settings).toBeVisible();
  await expect(remove).toBeVisible();

  // Settings (default tone) is preselected, so it carries the primary green
  // solid fill while the resting danger row stays flat (transparent).
  const settingsFill = await backgroundColor(settings);
  expect(settingsFill).not.toBe("rgba(0, 0, 0, 0)");
  expect(await backgroundColor(remove)).toBe("rgba(0, 0, 0, 0)");

  await remove.hover();
  // Hover moves the highlight to the danger row, which fills with the deep-rose
  // danger color (rgb(143, 58, 48)) rather than the primary green, and Settings
  // falls back to flat.
  await expect.poll(() => backgroundColor(remove)).toBe("rgb(143, 58, 48)");
  await expect.poll(() => backgroundColor(settings)).toBe("rgba(0, 0, 0, 0)");

  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Remove")).toBeVisible();
  await expect(remove).toBeHidden();

  await page.getByRole("button", { name: "Open action menu" }).click();
  await expect(settings).toBeVisible();
  await expect.poll(() => backgroundColor(settings)).toBe(settingsFill);
  await expect.poll(() => backgroundColor(remove)).toBe("rgba(0, 0, 0, 0)");
});

test("dropdown action menu keeps row subtext legible on the solid highlight", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-action-menu-subtext",
  );

  await page.getByRole("button", { name: "Open settings menu" }).click();

  const activeSubtext = page.getByText("Members, roles & billing");
  const restingSubtext = page.getByText("Permanently delete this workspace");
  await expect(activeSubtext).toBeVisible();
  await expect(restingSubtext).toBeVisible();

  // The first row is preselected, so it carries the solid `primary` fill. Its
  // subtext must invert to the surface white (rgb(255, 255, 255)) — the muted
  // grey it otherwise inherits all but vanishes against the fill. The resting
  // row keeps the muted grey (rgb(105, 112, 106)) on the plain surface.
  await expect.poll(() => textColor(activeSubtext)).toBe("rgb(255, 255, 255)");
  expect(await textColor(restingSubtext)).toBe("rgb(105, 112, 106)");

  // Moving the highlight to the resting row inverts its subtext and lets the
  // previously active row's subtext fall back to the muted grey.
  await page.getByRole("menuitem", { name: /Remove business/ }).hover();
  await expect.poll(() => textColor(restingSubtext)).toBe("rgb(255, 255, 255)");
  await expect.poll(() => textColor(activeSubtext)).toBe("rgb(105, 112, 106)");
});

test("dropdown danger row highlights red with legible text when active", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-action-menu-subtext",
  );

  await page.getByRole("button", { name: "Open settings menu" }).click();

  const removeRow = page.getByRole("menuitem", { name: /Remove business/ });
  const removeLabel = page.getByText("Remove business", { exact: true });

  // Resting: the danger row carries its rose accent label on the plain surface.
  expect(await textColor(removeLabel)).toBe("rgb(168, 79, 69)");

  await removeRow.hover();

  // Active: the highlight swaps to the deep-rose danger fill (rgb(143, 58, 48))
  // rather than the primary green, and the label inverts to white so the
  // destructive action stays legible instead of red-on-green.
  await expect.poll(() => backgroundColor(removeRow)).toBe("rgb(143, 58, 48)");
  await expect.poll(() => textColor(removeLabel)).toBe("rgb(255, 255, 255)");
});

test("dropdown selector keeps trailing codes legible on the solid highlight", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--category-select");

  await page.getByRole("button", { name: "Category, Rental income" }).click();

  const activeMeta = page.getByText("4020");
  const restingMeta = page.getByText("4000");
  await expect(activeMeta).toBeVisible();
  await expect(restingMeta).toBeVisible();

  // The selected row ("Rental income") is preselected, so it carries the solid
  // `primary` fill. Its trailing code must invert to surface white
  // (rgb(255, 255, 255)) — the muted grey it otherwise keeps all but vanishes
  // against the fill (~1.2:1). A resting row stays muted (rgb(105, 112, 106)).
  await expect.poll(() => textColor(activeMeta)).toBe("rgb(255, 255, 255)");
  expect(await textColor(restingMeta)).toBe("rgb(105, 112, 106)");

  // Moving the highlight to a resting row inverts its code and lets the
  // previously active row's code fall back to the muted grey.
  await page.getByRole("option", { name: /Sales/ }).hover();
  await expect.poll(() => textColor(restingMeta)).toBe("rgb(255, 255, 255)");
  await expect.poll(() => textColor(activeMeta)).toBe("rgb(105, 112, 106)");
});

test("dropdown hover menu opens on pointer hover and closes on hover out", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-hover-menu");

  const trigger = page.getByRole("button", { name: "Open hover menu" });
  const profile = page.getByRole("menuitem", { exact: true, name: "Profile" });

  await trigger.hover();
  await expect(profile).toBeVisible();

  // Move the pointer well away from the trigger and surface to hover out.
  await page.mouse.move(5, 5);
  await expect(profile).toBeHidden();
});

test("dropdown long-press menu opens on press-and-hold, not a plain tap", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--dropdown-long-press-menu",
  );

  const trigger = page.getByRole("button", { name: "Open long-press menu" });
  const rename = page.getByRole("menuitem", { exact: true, name: "Rename" });

  // A quick tap must not open a long-press menu.
  await trigger.click();
  await expect(rename).toBeHidden();

  // Press and hold past the long-press delay opens it.
  const box = await trigger.boundingBox();
  if (!box) {
    throw new Error("long-press trigger not found");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();

  await expect(rename).toBeVisible();
});

test("dropdown context menu opens on right-click, not on a left click", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dropdown-context-menu");

  const trigger = page.getByRole("button", { name: "Open context menu" });
  const copy = page.getByRole("menuitem", { exact: true, name: "Copy" });

  // A left click must not open a context menu.
  await trigger.click();
  await expect(copy).toBeHidden();

  await trigger.click({ button: "right" });
  await expect(copy).toBeVisible();
});

test("dropdown keyboard navigation keeps the active option in view", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--long-dropdown-selector");

  await page.getByRole("button", { name: "Long list, Long option 01" }).click();
  await expect(
    page.getByRole("option", { exact: true, name: "Long option 01" }),
  ).toBeVisible();

  for (let step = 0; step < 15; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  await expect
    .poll(() => dropdownScrollState(page, "Long option 16"))
    .toMatchObject({
      activeInView: true,
      scrolled: true,
    });
});

test("dropdown selector pins header and footer while options scroll", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--selector-with-header-footer",
  );

  await page.getByRole("button", { name: "Scheme, Long option 01" }).click();

  const header = page.getByText("Choose a scheme");
  // The footer is a custom action control (the story renders it as a
  // `role="button"`), not a selectable listbox option, so target it by button.
  const footer = page.getByRole("button", { name: "Add scheme" });
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  const option = page.getByRole("option", {
    exact: true,
    name: "Long option 03",
  });
  const headerBefore = await header.boundingBox();
  const footerBefore = await footer.boundingBox();
  const optionBefore = await option.boundingBox();

  for (let step = 0; step < 18; step += 1) {
    await page.keyboard.press("ArrowDown");
  }

  const headerAfter = await header.boundingBox();
  const footerAfter = await footer.boundingBox();
  const optionAfter = await option.boundingBox();

  // The option rows scroll up...
  expect(optionBefore).not.toBeNull();
  expect(optionAfter).not.toBeNull();
  expect(
    Math.abs((optionAfter?.y ?? 0) - (optionBefore?.y ?? 0)),
  ).toBeGreaterThan(20);

  // ...while the pinned header and footer keep their position and stay visible.
  expect(headerBefore).not.toBeNull();
  expect(footerBefore).not.toBeNull();
  expect(
    Math.abs((headerAfter?.y ?? 0) - (headerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs((footerAfter?.y ?? 0) - (footerBefore?.y ?? 0)),
  ).toBeLessThanOrEqual(1);
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();

  // The footer must sit fully inside the clipping surface; the surface padding
  // previously pushed it past the overflow:hidden bottom edge and clipped it.
  expect(await bottomOverflowPast(footer, "clip")).toBeLessThanOrEqual(1);
});

async function bottomOverflowPast(
  locator: ReturnType<Page["getByRole"]>,
  _label: string,
) {
  return locator.evaluate((element) => {
    let clip = element.parentElement;
    while (clip) {
      const overflowY = getComputedStyle(clip).overflowY;
      if (
        overflowY === "hidden" ||
        overflowY === "auto" ||
        overflowY === "scroll"
      ) {
        break;
      }
      clip = clip.parentElement;
    }
    if (!clip) {
      return 0;
    }
    return (
      element.getBoundingClientRect().bottom -
      clip.getBoundingClientRect().bottom
    );
  });
}

async function backgroundColor(locator: ReturnType<Page["getByRole"]>) {
  return locator.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
}

async function textColor(locator: ReturnType<Page["getByText"]>) {
  return locator.evaluate((element) => getComputedStyle(element).color);
}

test("open dropdown surface follows the trigger when the page scrolls", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=dropdown-examples--selector-scroll-tracking",
  );

  const trigger = page.getByRole("button", { name: "Scroll field, Standard" });
  await trigger.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // The menu opens a fixed gutter below the trigger.
  const before = await triggerSurfaceAlignment(trigger, listbox);
  expect(before.gap).toBeGreaterThanOrEqual(0);
  expect(before.gap).toBeLessThan(30);

  // Scroll the page while the menu is open. The web surface lives in a
  // `position: fixed` portal; without re-measuring on scroll it would stay
  // pinned to its stale viewport coordinates and detach from the moved trigger.
  await page.evaluate(() => window.scrollTo(0, 320));

  // The surface re-measures on the next frame and keeps the same offset from
  // the trigger, so the menu stays anchored as the page scrolls.
  await expect
    .poll(async () => {
      const now = await triggerSurfaceAlignment(trigger, listbox);
      return Math.abs(now.gap - before.gap);
    })
    .toBeLessThanOrEqual(2);

  // The trigger genuinely scrolled up, so the gap-stability check above is a
  // real test of tracking rather than a no-op.
  const after = await triggerSurfaceAlignment(trigger, listbox);
  expect(before.triggerTop - after.triggerTop).toBeGreaterThan(100);
});

async function triggerSurfaceAlignment(
  trigger: ReturnType<Page["getByRole"]>,
  surface: ReturnType<Page["getByRole"]>,
) {
  const triggerBox = await trigger.boundingBox();
  const surfaceBox = await surface.boundingBox();
  if (!triggerBox || !surfaceBox) {
    return { gap: Number.NaN, triggerTop: Number.NaN };
  }
  return {
    gap: surfaceBox.y - (triggerBox.y + triggerBox.height),
    triggerTop: triggerBox.y,
  };
}

test("searchable dropdown selector filters options and selects by keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--searchable-selector");

  await page.getByRole("button", { name: "Currency, US Dollar" }).click();

  // The search input is focused on open. Typing (including the space bar, which
  // must reach the input rather than activate a row) narrows the option rows
  // while keeping focus in the input.
  const search = page.getByPlaceholder("Search options");
  await expect(search).toBeFocused();

  // The search field's border lines up with the option rows' (selected)
  // background, so its left and right edges match the highlighted row.
  const alignment = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Search options"]');
    const field = input?.parentElement ?? null;
    const selectedRow =
      Array.from(document.querySelectorAll('[role="option"]')).find(
        (element) => element.textContent?.trim() === "US Dollar",
      ) ?? null;
    if (!field || !selectedRow) {
      return null;
    }
    const fieldRect = field.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    return {
      left: Math.abs(fieldRect.left - rowRect.left),
      right: Math.abs(fieldRect.right - rowRect.right),
    };
  });
  expect(alignment).not.toBeNull();
  expect(alignment?.left).toBeLessThanOrEqual(1);
  expect(alignment?.right).toBeLessThanOrEqual(1);

  await search.pressSequentially("new z");
  await expect(
    page.getByRole("option", { exact: true, name: "New Zealand Dollar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "US Dollar" }),
  ).toBeHidden();
  await expect(search).toBeFocused();

  // Enter activates the highlighted match and closes the menu.
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Currency, New Zealand Dollar" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search options")).toBeHidden();

  // Reopening starts from the full list again; a non-matching query shows the
  // empty state.
  await page
    .getByRole("button", { name: "Currency, New Zealand Dollar" })
    .click();
  await page.getByPlaceholder("Search options").fill("zzz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { exact: true, name: "Euro" }),
  ).toBeHidden();
});

test("combobox keeps input focus while filtering options", async ({ page }) => {
  await page.goto("/iframe.html?id=dropdown-examples--input-backed-combobox");

  const input = page.getByPlaceholder("Search to add...");
  await input.click();
  await input.fill("pay");

  await expect(page.getByText("Payroll Reserve")).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("zz");
  // The shared aria-live region echoes the empty-state copy for screen readers
  // (WCAG 4.1.3), so scope to the visible listbox to skip the announced node.
  await expect(
    page.getByRole("listbox").getByText("No matching options"),
  ).toBeVisible();
  await expect(input).toBeFocused();
  await expect(
    page.getByText("Only active books can be selected."),
  ).toBeVisible();
});

test("selector trigger keeps a value-independent name across selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--explicit-selector");

  // triggerLabel gives a stable, value-independent accessible name; the value
  // stays visible in the trigger text.
  const trigger = page.getByRole("button", { exact: true, name: "Scheme" });
  await expect(trigger).toContainText("Standard");

  await trigger.click();
  // Duplicate visible labels ("Custom") are disambiguated by per-option
  // accessibilityLabel, so each option resolves by a distinct name.
  await expect(
    page.getByRole("option", { name: "Custom start date" }),
  ).toBeVisible();
  await page.getByRole("option", { name: "Custom end date" }).click();

  // The trigger still resolves by the same name "Scheme" after the value
  // changed to "Custom" — the name did not move with the selection.
  const afterSelection = page.getByRole("button", {
    exact: true,
    name: "Scheme",
  });
  await expect(afterSelection).toBeVisible();
  await expect(afterSelection).toContainText("Custom");
});

test("dropdown placement flips above the trigger near the bottom edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--bottom-edge-flip");

  // The selector pinned to the bottom of the viewport has no room below, so the
  // long menu opens upward: its rows sit above the trigger.
  const bottomTrigger = page.getByRole("button", {
    name: "Flips above, Long option 01",
  });
  await bottomTrigger.click();
  const bottomTriggerBox = await bottomTrigger.boundingBox();
  const upwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(bottomTriggerBox).not.toBeNull();
  expect(upwardOption).not.toBeNull();
  expect(upwardOption?.y ?? 0).toBeLessThan(bottomTriggerBox?.y ?? 0);
  await page.keyboard.press("Escape");

  // The selector near the top has space below, so the same menu opens downward.
  const topTrigger = page.getByRole("button", {
    name: "Opens below, Long option 01",
  });
  await topTrigger.click();
  const topTriggerBox = await topTrigger.boundingBox();
  const downwardOption = await page
    .getByRole("option", { exact: true, name: "Long option 02" })
    .boundingBox();
  expect(topTriggerBox).not.toBeNull();
  expect(downwardOption).not.toBeNull();
  expect(downwardOption?.y ?? 0).toBeGreaterThan(topTriggerBox?.y ?? 0);
});

test("dropdown placement clamps a wide menu inside the side edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--horizontal-edge-clamp");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  // The right-edge menu is wider than its trigger, so it shifts left to stay
  // fully on screen rather than spilling past the right edge.
  const rightTrigger = page.getByRole("button", {
    name: "Open right edge menu",
  });
  await rightTrigger.click();
  const rightTriggerBox = await rightTrigger.boundingBox();
  const rightOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(rightTriggerBox).not.toBeNull();
  expect(rightOption).not.toBeNull();
  // Fully inside the right edge...
  expect((rightOption?.x ?? 0) + (rightOption?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
  // ...and shifted left of the trigger to make room.
  expect(rightOption?.x ?? 0).toBeLessThan(rightTriggerBox?.x ?? 0);
  await page.keyboard.press("Escape");

  // The left-edge menu stays pinned at the left margin (never off-screen).
  await page.getByRole("button", { name: "Open left edge menu" }).click();
  const leftOption = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(leftOption).not.toBeNull();
  expect(leftOption?.x ?? -1).toBeGreaterThanOrEqual(0);
});

test("dropdown placement end-aligns a wide menu to the trigger edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--end-aligned-menu");

  const trigger = page.getByRole("button", { name: "Open end aligned menu" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("menuitem", { exact: true, name: "British Pound" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // The wide menu extends leftward from the trigger...
  expect(option?.x ?? 0).toBeLessThan(triggerBox?.x ?? 0);
  // ...while its right edge stays aligned to the trigger's right edge.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    (triggerBox?.x ?? 0) + (triggerBox?.width ?? 0) + 2,
  );
});

test("dropdown placement grid flips and stays on screen at the bottom corner", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--edge-placement-grid");
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  const trigger = page.getByRole("button", { name: "Bottom right, Region 01" });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  const option = await page
    .getByRole("option", { exact: true, name: "Region 02" })
    .boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(option).not.toBeNull();
  // Flipped above the trigger near the bottom edge...
  expect(option?.y ?? 0).toBeLessThan(triggerBox?.y ?? 0);
  // ...and inside the right edge of the screen.
  expect((option?.x ?? 0) + (option?.width ?? 0)).toBeLessThanOrEqual(
    viewportWidth,
  );
});

test("placement playground reports the side resolved against the content edges", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--placement-playground");

  // Moving the trigger to the bottom of the content frame leaves no room below,
  // so the engine resolves an upward placement.
  await page
    .getByRole("button", { name: "Move trigger to bottom-right" })
    .click();
  await expect(page.getByText("Opens upward ↑")).toBeVisible();

  // Near the top there is room below, so it resolves a downward placement.
  await page.getByRole("button", { name: "Move trigger to top-left" }).click();
  await expect(page.getByText("Opens downward ↓")).toBeVisible();
});

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

test("segmented control toggles report and source choices", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  await expect(
    page.getByRole("radio", { name: "Profit & loss" }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "Balance sheet" }).click();
  await expect(
    page.getByRole("radio", { name: "Balance sheet" }),
  ).toBeChecked();

  await expect(page.getByRole("radio", { name: "Combined" })).toBeChecked();
  await page.getByRole("radio", { name: "Consulting" }).click();
  await expect(page.getByRole("radio", { name: "Consulting" })).toBeChecked();

  // The outline (filter-pill) variant keeps its instant per-cell selection — it
  // draws no sliding thumb.
  await expect(
    page
      .getByRole("radiogroup", { name: "Income source" })
      .getByTestId("segmentedThumb"),
  ).toHaveCount(0);
});

test("segmented control checks the focused segment with Space and Enter", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=segmented-examples--profit-loss-segmented-control",
  );

  const profitLoss = page.getByRole("radio", { name: "Profit & loss" });
  const balanceSheet = page.getByRole("radio", { name: "Balance sheet" });
  await expect(profitLoss).toBeChecked();

  // Arrow keys move the roving tab stop; Space then checks the focused segment,
  // as the radio-group pattern requires. React Native Web's press responder
  // binds Spacebar to `button` roles only, so a `radio` has to press itself —
  // and must swallow the key so it does not scroll the page instead.
  await profitLoss.focus();
  await page.keyboard.press("ArrowRight");
  await expect(balanceSheet).toBeFocused();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("Space");
  await expect(balanceSheet).toBeChecked();
  await expect(profitLoss).not.toBeChecked();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  // Enter checks too, exactly once — the responder presses it on every role, so
  // the segment must not claim Enter as well or `onChange` would fire twice.
  await page.keyboard.press("ArrowLeft");
  await expect(profitLoss).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(profitLoss).toBeChecked();
  await expect(balanceSheet).not.toBeChecked();
});

test("segmented control disambiguates duplicate labels by name", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--duplicate-labels");

  const start = page.getByRole("radio", { name: "Custom start date" });
  const end = page.getByRole("radio", { name: "Custom end date" });
  const auto = page.getByRole("radio", { exact: true, name: "Auto" });
  await expect(auto).toBeChecked();
  await start.click();
  await expect(start).toBeChecked();
  await expect(end).not.toBeChecked();
  await end.click();
  await expect(end).toBeChecked();
  await expect(start).not.toBeChecked();
});

test("segmented pill thumb slides over the selected tab and resizes to it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--animated-tabs");

  const group = page.getByRole("radiogroup", {
    exact: true,
    name: "Calendar view",
  });
  const thumb = group.getByTestId("segmentedThumb");
  const day = group.getByRole("radio", { name: "Day" });
  const quarter = group.getByRole("radio", { name: "Quarter" });

  // The thumb is a single raised surface that glides — it carries a real
  // left/width CSS transition rather than snapping.
  await expect(thumb).toHaveCSS("transition-property", /left|width/);

  // At rest it overlays the selected pill (sub-pixel: allow a 2px tolerance).
  const near = (a?: number, b?: number, tol = 2) =>
    a !== undefined && b !== undefined && Math.abs(a - b) <= tol;
  const dayBox = await day.boundingBox();
  await expect
    .poll(async () => near((await thumb.boundingBox())?.x, dayBox?.x))
    .toBe(true);

  // Switching tabs moves the thumb to — and resizes it to fit — "Quarter",
  // which is wider than "Day".
  await quarter.click();
  const quarterBox = await quarter.boundingBox();
  await expect
    .poll(async () => {
      const box = await thumb.boundingBox();
      return near(box?.x, quarterBox?.x) && near(box?.width, quarterBox?.width);
    })
    .toBe(true);
  expect(quarterBox?.width ?? 0).toBeGreaterThan(dayBox?.width ?? 0);
});

test("segmented animated={false} snaps the thumb without a slide transition", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--animated-tabs");

  const group = page.getByRole("radiogroup", {
    exact: true,
    name: "Static calendar view",
  });
  const thumb = group.getByTestId("segmentedThumb");

  // No left/width transition — the thumb is placed, not animated.
  await expect(thumb).not.toHaveCSS("transition-property", /left|width/);

  // It still tracks selection: one frame after the click it is already over the
  // newly selected pill (no mid-slide), confirming the thumb snaps.
  const quarter = group.getByRole("radio", { name: "Quarter" });
  await quarter.click();
  const quarterBox = await quarter.boundingBox();
  await expect
    .poll(
      async () => {
        const box = await thumb.boundingBox();
        return Math.abs((box?.x ?? 0) - (quarterBox?.x ?? 0)) <= 2;
      },
      { timeout: 1000 },
    )
    .toBe(true);
});

test("radio cards expose checked and disabled option states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--accounting-basis-radio-cards",
  );

  const cash = page.getByRole("radio", { name: /Cash basis/ });
  const accrual = page.getByRole("radio", { name: /Accrual basis/ });
  const flatRate = page.getByRole("radio", { name: /Flat rate VAT/ });

  await expect(cash).toBeChecked();
  await accrual.click();
  await expect(accrual).toBeChecked();
  await expect(cash).not.toBeChecked();
  await cash.focus();
  await page.keyboard.press("Space");
  await expect(cash).toBeChecked();
  await expect(accrual).not.toBeChecked();
  await expect(flatRate).toBeDisabled();
});

test("radio card names default to the title and accept overrides", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--distinguishable-radio-cards",
  );

  const recommended = page.getByRole("radio", {
    name: "Cash basis (recommended)",
  });
  const plain = page.getByRole("radio", { exact: true, name: "Cash basis" });
  await expect(recommended).toBeVisible();
  await expect(plain).toBeVisible();
  await expect(recommended).toBeChecked();
  await plain.click();
  await expect(plain).toBeChecked();
  await expect(recommended).not.toBeChecked();
});

test("switch toggles a binary setting", async ({ page }) => {
  await page.goto("/iframe.html?id=switch-examples--privacy-toggle");

  const toggle = page.getByRole("switch", { name: "Analytics cookies" });
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();

  // Enter must toggle exactly once. React Native Web's press responder presses
  // Enter on any role — on keyup — while the switch's own `onKeyDown` runs on
  // keydown, so a handler that also claims Enter toggles twice and the key
  // looks dead. Space is the mirror case: the responder binds it to `button`
  // roles only, so the switch has to own it.
  await page.keyboard.press("Enter");
  await expect(toggle).not.toBeChecked();
  await page.keyboard.press("Enter");
  await expect(toggle).toBeChecked();
});

test("list exposes list semantics and activates items by click and keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=list-examples--clickable-items");

  // Proper list semantics around the clickable rows: a list owning one
  // listitem per person.
  await expect(page.getByRole("list")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(3);

  await page.getByRole("button", { name: "Open Calum Moore" }).click();
  await expect(page.getByText("Opened Calum Moore")).toBeVisible();

  // Each item is a real button, so it is focusable and activates on Enter.
  const peter = page.getByRole("button", { name: "Open Peter Parker" });
  await peter.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Opened Peter Parker")).toBeVisible();
});

test("list draws a separator between items but not after the last", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=list-examples--payroll");

  // Three people → two separators between them, and crucially none trailing the
  // final row (the bug the component fixes). Separators are presentational
  // (aria-hidden), so assert against the rendered hairline DOM.
  await expect(page.getByRole("listitem")).toHaveCount(3);

  const layout = await page.evaluate(() => {
    const list = document.querySelector('[role="list"]');
    if (!list) return null;
    const children = Array.from(list.children);
    const isSeparator = (el: Element) =>
      el.getAttribute("role") === "presentation" &&
      el.getAttribute("aria-hidden") === "true";
    return {
      separators: children.filter(isSeparator).length,
      lastIsSeparator: isSeparator(children[children.length - 1]),
    };
  });
  // Three items → exactly two separators between them, and — the bug fix — the
  // final child is an item, never a trailing separator.
  expect(layout?.separators).toBe(2);
  expect(layout?.lastIsSeparator).toBe(false);
});

test("drag-select marquee selects intersecting target rows", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--ledger-rows");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await expect(page.getByText("3 transactions", { exact: true })).toBeVisible();
  await page.mouse.up();

  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
  await expect(
    page.getByText("Last change: txn_1, txn_2, txn_3"),
  ).toBeVisible();
});

test("drag-select marquee can start in page content", async ({ page }) => {
  await page.goto("/iframe.html?id=drag-select-examples--page-content-area");

  const startZone = page.getByTestId("drag-page-content-start-zone");
  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const startBox = await startZone.boundingBox();
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(startBox).not.toBeNull();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (startBox?.x ?? 0) + (startBox?.width ?? 0) / 2,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await page.mouse.up();

  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
  await expect(
    page.getByText("Last change: txn_1, txn_2, txn_3"),
  ).toBeVisible();
});

test("drag-select minimum distance gates matching and selection", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--larger-minimum-drag");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (firstBox?.x ?? 0) + 20,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
    { steps: 4 },
  );
  await expect(page.getByText("Matching 0 transactions")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText("Selected 3 transactions")).toBeVisible();
});

test("drag-select pointer cancellation clears active drag", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=drag-select-examples--ledger-rows");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );
  await expect(page.getByText("Matching 3 transactions")).toBeVisible();

  await page.evaluate(() => {
    document.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(page.getByText("Matching 3 transactions")).toBeHidden();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();

  await page.mouse.up();
  await expect(page.getByText("Last change: none")).toBeVisible();
});

test("drag-select disabled state cancels active drag", async ({ page }) => {
  await page.goto("/iframe.html?id=drag-select-examples--disabled-during-drag");

  const first = page.getByTestId("drag-target-txn_1");
  const third = page.getByTestId("drag-target-txn_3");
  const firstBox = await first.boundingBox();
  const thirdBox = await third.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();

  await page.mouse.move(
    (firstBox?.x ?? 0) + 8,
    (firstBox?.y ?? 0) + (firstBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (thirdBox?.x ?? 0) + (thirdBox?.width ?? 0) - 8,
    (thirdBox?.y ?? 0) + (thirdBox?.height ?? 0) / 2,
    { steps: 8 },
  );

  await expect(page.getByTestId("drag-disabled-state")).toHaveText(
    "Drag disabled",
  );
  await expect(page.getByText("Matching 3 transactions")).toBeHidden();

  await page.mouse.up();
  await expect(page.getByText("Selected 0 transactions")).toBeVisible();
  await expect(page.getByText("Last change: none")).toBeVisible();
});

test("web modal restores focus and allows nested dropdowns above the surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--centered-web-modal");

  await page.getByRole("button", { name: "Close Invite teammate" }).click();
  const openButton = page.getByRole("button", { name: "Open Invite teammate" });
  await openButton.click();
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeVisible();

  const textField = page.getByLabel("Modal text field");
  await textField.fill("Focus stays here");
  await expect(textField).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Invite teammate" }),
  ).toBeHidden();
  await expect(openButton).toBeFocused();

  await openButton.click();
  const closeButton = page.getByRole("button", {
    name: "Close Invite teammate",
  });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textField).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Nested selector, Standard" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();

  await page.getByRole("button", { name: "Nested selector, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  const modalBox = await page
    .getByRole("dialog", { name: "Invite teammate" })
    .boundingBox();
  const optionBox = await page.getByText("Cash accounting").boundingBox();
  expect(modalBox).not.toBeNull();
  expect(optionBox).not.toBeNull();
  expect(optionBox?.y).toBeGreaterThanOrEqual((modalBox?.y ?? 0) - 1);
});

test("a dropdown inside a modal closes on Escape without closing the modal", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=modal-examples--centered-web-modal");
  const dialog = page.getByRole("dialog", { name: "Invite teammate" });
  await expect(dialog).toBeVisible();

  // Open the selector nested inside the modal.
  await page.getByRole("button", { name: "Nested selector, Standard" }).click();
  await expect(page.getByText("Cash accounting")).toBeVisible();

  // Escape closes only the dropdown list (the top-most layer); the modal beneath
  // it stays open. This is the regression: Escape used to close both at once.
  await page.keyboard.press("Escape");
  await expect(page.getByText("Cash accounting")).toBeHidden();
  await expect(dialog).toBeVisible();

  // With no overlay above it, a second Escape now closes the modal itself.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("date field opens the calendar, navigates months, and picks a day", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open calendar popover is role="dialog" labelled by the field, so it
  // shares the "Year ends" accessible name with the input; target the textbox
  // explicitly. The visible month title also lives inside the dialog, while the
  // shared aria-live region announces the month on navigation (WCAG 4.1.3), so
  // scope month-text assertions to the dialog to skip the announced copy.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");
  // Clear is opt-in: the default field shows no clear button even with a value.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();

  // Focusing the input opens the calendar on the value's month.
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2026" }).click();
  await expect(input).toHaveValue("15 Mar 2026");
  await expect(dialog).toBeHidden();

  // Reopen and step to the previous month, then pick a day there.
  await input.click();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(dialog.getByText("February 2026")).toBeVisible();
  await page.getByRole("button", { name: "10 Feb 2026" }).click();
  await expect(input).toHaveValue("10 Feb 2026");
});

test("date calendar z-index override clears overlapping content", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--calendar-layering");

  const input = page.getByLabel("Layered date");
  await input.click();
  await expect(page.getByText("Overlapping panel")).toBeVisible();
  const day = page.getByRole("button", { name: "15 Mar 2026" });
  await expect(day).toBeVisible();

  const topLabel = await day.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return (
      target?.closest("[aria-label]")?.getAttribute("aria-label") ??
      target?.textContent ??
      ""
    );
  });

  expect(topLabel).toBe("15 Mar 2026");
});

test("data-grid date editor uses the inline calendar on web", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=datagrid-examples--editable");

  const createdCell = page
    .getByRole("gridcell")
    .filter({ hasText: "29 Jun 2026" })
    .first();
  await createdCell.click();
  await createdCell.click();

  const input = page.getByRole("textbox", { name: "Created" });
  const calendar = page.getByRole("dialog", { name: "Created" });
  await expect(input).toBeFocused();
  await expect(calendar.getByText("June 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeHidden();

  await calendar.getByRole("button", { name: "28 Jun 2026" }).click();
  await expect(calendar).toBeHidden();
  await expect(
    page.getByRole("gridcell").filter({ hasText: "28 Jun 2026" }).first(),
  ).toBeVisible();
});

test("date field jumps to a far year through the header year picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover shares the "Year ends" name with the input (it is a
  // role="dialog" labelled by the field), so address the textbox by role; the
  // visible month title lives inside that dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();
  await expect(dialog.getByText("March 2026")).toBeVisible();

  // Clicking the month/year title swaps the day grid for a year picker, where
  // the current year is shown selected and the day grid is gone.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  // The current year carries the filled selected background; an unselected year
  // is transparent. (RNW does not surface accessibilityState.selected as
  // aria-selected on role="button", matching the day cells, so assert the style.)
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const selectedBg = await page
    .getByRole("button", { exact: true, name: "2026" })
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(selectedBg).not.toBe("rgba(0, 0, 0, 0)");
  await expect(
    page.getByRole("button", { name: "Previous month" }),
  ).toBeHidden();

  // Picking a year in view jumps straight to it, keeps the month, and returns to
  // the day grid — without committing a date yet.
  await page.getByRole("button", { exact: true, name: "2018" }).click();
  await expect(dialog.getByText("March 2018")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Reopen the picker and page whole blocks forwards and backwards with the
  // header chevrons.
  await page.getByRole("button", { name: "March 2018, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2030" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "2018" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Previous years" }).click();
  await page.getByRole("button", { name: "Previous years" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2010" }),
  ).toBeVisible();

  // Choosing a year there, then a day, commits as usual and closes the calendar.
  await page.getByRole("button", { exact: true, name: "2010" }).click();
  await expect(dialog.getByText("March 2010")).toBeVisible();
  await page.getByRole("button", { name: "15 Mar 2010" }).click();
  await expect(input).toHaveValue("15 Mar 2010");
  await expect(dialog).toBeHidden();
});

test("year picker returns to the day grid via the title and keeps keyboard focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--single-date-field");

  // The open popover (role="dialog") shares the field's "Year ends" name, so
  // target the input by its textbox role; the month title lives in the dialog.
  const input = page.getByRole("textbox", { name: "Year ends" });
  const dialog = page.getByRole("dialog", { name: "Year ends" });
  await input.click();

  // Clicking the title again (now "back to month") returns to the day grid
  // without committing a date.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /back to month/ }).click();
  await expect(dialog.getByText("March 2026")).toBeVisible();
  await expect(input).toHaveValue("31 Mar 2026");

  // Selecting a year by keyboard moves focus to the relabelled title button
  // rather than stranding it on <body> when the chosen year cell unmounts.
  await page.getByRole("button", { name: "March 2026, change year" }).click();
  await page.getByRole("button", { exact: true, name: "2024" }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("March 2024")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "March 2024, change year" }),
  ).toBeFocused();
});

test("bounded date field disables out-of-range years in the picker", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-date-field");

  const input = page.getByLabel("Year ends");
  await input.click();
  await page.getByRole("button", { name: "March 2026, change year" }).click();

  // Years inside the [2024, 2027] window are pickable; years outside it are not.
  await expect(
    page.getByRole("button", { exact: true, name: "2025" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2023" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { exact: true, name: "2016" }),
  ).toBeDisabled();
});

test("popover opens content and closes by Escape, inside close, and outside press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--content-popover");

  const trigger = page.getByRole("button", { name: "Details" });
  const content = page.getByText("Greenhouse Studio");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();

  // Pressing the trigger opens the surface and reports the expanded state.
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Escape closes it.
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // A close control inside the content closes it via the render-prop `close`.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(content).toBeHidden();

  // An outside press dismisses it through the document-level listener.
  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(content).toBeHidden();
});

test("controlled popover drives external state through onOpenChange", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--controlled-popover");

  const trigger = page.getByRole("button", { name: "Account" });
  const content = page.getByText("Greenhouse Studio");
  const status = page.getByText("Popover is closed");

  // The surface only opens because onOpenChange updated the external state that
  // feeds the controlled `open` prop back in.
  await expect(status).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Popover is open")).toBeVisible();
  await expect(content).toBeVisible();

  // Each dismissal path fires onOpenChange, which closes it via external state.
  await page.keyboard.press("Escape");
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();

  await trigger.click();
  await expect(content).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByText("Popover is closed")).toBeVisible();
  await expect(content).toBeHidden();
});

test("a selector nested in a popover selects an option without closing the popover", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--selector-in-popover");

  // The popover surface is a named dialog; its trigger is a button that shares
  // the "Line settings" name, so address each by its distinct role.
  const trigger = page.getByRole("button", { name: "Line settings" });
  const dialog = page.getByRole("dialog", { name: "Line settings" });
  await expect(dialog).toBeHidden();

  await trigger.click();
  await expect(dialog).toBeVisible();

  // Open the nested selector. Its menu renders in its own body portal, so it
  // escapes the popover's clipping box and stacks above the surface.
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();

  // The option's centre hit-tests to the option itself, proving the nested menu
  // stacks on top of the popover rather than being covered by it.
  const onTop = await option.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return element === hit || element.contains(hit);
  });
  expect(onTop).toBe(true);

  // Selecting updates the field AND leaves the popover open — the regression:
  // the popover's outside-press dismissal used to treat the sibling-portal
  // option as an outside press and close the whole popover on selection.
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  // A press elsewhere in the popover (its title, outside the menu) closes only
  // the menu; the popover stays open.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await dialog.getByText("Line settings").click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(dialog).toBeVisible();
});

test("a selector nested in a popover closes one layer per Escape and per outside press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--selector-in-popover");
  const dialog = page.getByRole("dialog", { name: "Line settings" });

  await page.getByRole("button", { name: "Line settings" }).click();
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeVisible();

  // Escape closes only the top layer (the menu); the popover beneath stays open.
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeHidden();
  await expect(dialog).toBeVisible();

  // With no overlay above it, the next Escape closes the popover itself.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // A single outside press with both open dismisses the whole stack.
  await page.getByRole("button", { name: "Line settings" }).click();
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(
    page.getByRole("option", { name: "Cash accounting" }),
  ).toBeHidden();
  await expect(dialog).toBeHidden();
});

test("responsive popover opens an anchored dialog with focus management and a nested selector", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-popover-web");

  const trigger = page.getByRole("button", { name: "Filters" });
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // Opening moves focus into the surface (web focus management) and exposes the
  // named dialog anchored to the trigger.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const focusInDialog = await page.evaluate(() => {
    const surface = document.querySelector('[role="dialog"]');
    return surface
      ? surface === document.activeElement ||
          surface.contains(document.activeElement)
      : false;
  });
  expect(focusInDialog).toBe(true);

  // The nested selector's menu escapes the dialog's clip box; selecting an
  // option updates the field and leaves the dialog open (non-modal anchored
  // surface + the shared descendant-aware dismissal).
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  // Escape closes the top layer (menu) first, the dialog second, and focus
  // returns to the trigger.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("responsive menu navigates with the keyboard while focus rests on the dialog surface", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-menu-story");

  const trigger = page.getByRole("button", { name: "Row actions" });
  const dialog = page.getByRole("dialog", { name: "Row actions" });
  await expect(dialog).toBeHidden();

  await trigger.click();
  await expect(dialog).toBeVisible();
  // The rows are exposed as menuitems inside the dialog.
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();

  // Focus lands on the dialog surface, NOT inside the list — the exact condition
  // that leaves a bare DropdownList's arrow keys dead (its handler is bound to
  // the inner ScrollView). Navigation still works here because the menu owns a
  // document-level keydown listener that drives the active row.
  const focusOnSurface = await page.evaluate(() => {
    const surface = document.querySelector('[role="dialog"]');
    return surface !== null && surface === document.activeElement;
  });
  expect(focusOnSurface).toBe(true);

  // ArrowDown moves off the preselected first row (Rename) to Duplicate; Enter
  // runs it and closes the menu, returning focus to the trigger.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Duplicate")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // Reopening resets the active row to the first item, so a bare Enter selects
  // Rename with no arrow press.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last action: Rename")).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("responsive menu surface suppresses the browser's default focus ring", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=popover-examples--responsive-menu-story");

  // Open via the keyboard so Chrome's `:focus-visible` heuristic engages — the
  // state where the UA would otherwise draw a heavy blue outline around the
  // whole surface (a mouse open never matches `:focus-visible`, so it hides the
  // regression).
  await page.getByRole("button", { name: "Row actions" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();

  const surface = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el.getAttribute("role") !== "dialog") return null;
    return {
      focusVisible: el.matches(":focus-visible"),
      outlineStyle: getComputedStyle(el).outlineStyle,
    };
  });
  // Focus lands on the dialog surface and it DOES match `:focus-visible`, yet the
  // UA outline is suppressed — the active row highlight is the focus affordance.
  expect(surface?.focusVisible).toBe(true);
  expect(surface?.outlineStyle).toBe("none");
});

test("web sheet opens the modal bottom-sheet placement and closes on Escape", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=sheet-examples--bottom-sheet");

  const sheet = page.getByRole("dialog", { name: "Line settings" });
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Open sheet" }).click();
  await expect(sheet).toBeVisible();

  // A selector nested in the sheet opens and selecting keeps the sheet open.
  await page.getByRole("button", { name: "VAT scheme, Standard" }).click();
  const option = page.getByRole("option", { name: "Cash accounting" });
  await expect(option).toBeVisible();
  await option.click();
  await expect(
    page.getByRole("button", { name: "VAT scheme, Cash accounting" }),
  ).toBeVisible();
  await expect(sheet).toBeVisible();

  // Escape closes the menu, then the sheet.
  await page
    .getByRole("button", { name: "VAT scheme, Cash accounting" })
    .click();
  await expect(page.getByRole("option", { name: "Standard" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Standard" })).toBeHidden();
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("date field clears its value with the clear button", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // Exact match so the clear button ("Clear Year ends") is not also selected.
  const input = page.getByLabel("Year ends", { exact: true });
  await expect(input).toHaveValue("31 Mar 2026");

  // Open the calendar, then clear: clearing empties the field and closes the
  // calendar without popping a fresh one (focus returns to the empty input).
  await input.click();
  await expect(page.getByText("March 2026")).toBeVisible();
  await page.getByRole("button", { name: "Clear Year ends" }).click();

  await expect(input).toHaveValue("");
  await expect(page.getByText("March 2026")).toBeHidden();
  await expect(page.getByText("June 2026")).toBeHidden();
  // The clear button is gone once there is nothing left to clear.
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("date field clear button is keyboard reachable and restores focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });

  // Tabbing from the input reaches the clear button (the calendar icon is
  // tabIndex=-1 and skipped).
  await input.focus();
  await input.press("Tab");
  await expect(clear).toBeFocused();

  // Activating it via the keyboard clears the value and returns focus to the
  // now-empty input rather than dropping focus to the body.
  await clear.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
});

test("wheel date field stages a draft and commits the clamped date on Done", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  // The wheel variant uses the tap trigger (no editable input) on web too.
  const trigger = page.getByRole("button", { name: "Year ends: 31 Mar 2026" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const sheet = page.getByRole("dialog", { name: "Year ends" });
  await expect(sheet).toBeVisible();
  // The opened wheel shows the current value's columns.
  await expect(page.getByRole("button", { name: "Month Mar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Year 2026" })).toBeVisible();

  // Spinning to February clamps the 31st down to the month's last valid day,
  // and the draft is not committed until Done: the modal sheet stays open
  // (it does not auto-commit and close), so the trigger keeps its value.
  await page.getByRole("button", { name: "Month Feb" }).click();
  await expect(sheet).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  // Closing the sheet must not bounce it back open (focus returns to the trigger).
  await expect(page.getByRole("button", { name: "Done" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: 28 Feb 2026" }),
  ).toBeVisible();
});

test("wheel date field discards the draft on Cancel", async ({ page }) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-field");

  await page.getByRole("button", { name: "Year ends: 31 Mar 2026" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeVisible();

  await page.getByRole("button", { name: "Month Jan" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  // Cancel leaves the committed value untouched.
  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();
});

test("bounded wheel date field disables out-of-range rows and commits in range", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--bounded-wheel-date-field");

  await page
    .getByRole("button", { name: "Delivery date: 15 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Delivery date" }),
  ).toBeVisible();

  // Only 10–20 Mar 2026 is selectable, so rows outside the window are disabled.
  await expect(page.getByRole("button", { name: "Day 5" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Jan" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Month Apr" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Day 16" })).toBeEnabled();

  await page.getByRole("button", { name: "Day 16" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Delivery date: 16 Mar 2026" }),
  ).toBeVisible();
});

test("clearable wheel date field clears its value without opening the wheel", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-wheel-date-field");

  await expect(
    page.getByRole("button", { name: "Year ends: 31 Mar 2026" }),
  ).toBeVisible();

  // The clear button sits on the tap trigger; pressing it empties the field and
  // must not open the wheel sheet (clearing is a distinct action).
  await page.getByRole("button", { name: "Clear Year ends" }).click();
  await expect(page.getByRole("dialog", { name: "Year ends" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Year ends: Select a date" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear Year ends" }),
  ).toBeHidden();
});

test("wheel date range opens an independent wheel per endpoint", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--wheel-date-range");

  // Each endpoint is its own wheel sheet. Open the start endpoint and re-pick it.
  await page
    .getByRole("button", { name: "Current period start: 1 Apr 2025" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period start" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Month May" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Current period start: 1 May 2025" }),
  ).toBeVisible();

  // The end endpoint opens its own wheel, unchanged by the start edit.
  await page
    .getByRole("button", { name: "Current period end: 31 Mar 2026" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Current period end" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", { name: "Current period end: 31 Mar 2026" }),
  ).toBeVisible();
});

test("date clear button tracks the committed value, not the typed buffer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--clearable-date-field");

  // The open calendar is role="dialog" labelled "Year ends" too, so name the
  // input by its textbox role to avoid matching both.
  const input = page.getByRole("textbox", { name: "Year ends", exact: true });
  const clear = page.getByRole("button", { name: "Clear Year ends" });
  await expect(input).toHaveValue("31 Mar 2026");

  // Deleting all the text mid-edit does NOT commit (empty is unparseable), so
  // the committed date remains and the clear button stays visible.
  await input.focus();
  await input.fill("");
  await expect(clear).toBeVisible();

  // Now actually clear it, then type unparseable partial text into the empty
  // field: there is no committed value, so no clear button appears.
  await clear.click();
  await expect(input).toHaveValue("");
  await input.fill("5 Ju");
  await expect(clear).toBeHidden();
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

test("avatar renders initials and sizes the disc from the size prop", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=avatar-examples--user-avatars");

  // The solid (default) and soft variants both render their initials.
  await expect(page.getByText("GS", { exact: true })).toBeVisible();
  await expect(page.getByText("PR", { exact: true })).toBeVisible();
  await expect(page.getByText("AR", { exact: true })).toHaveCSS(
    "color",
    "rgb(116, 81, 31)",
  );
  await expect(page.locator('[aria-label="Accounts Receivable"]')).toHaveCSS(
    "background-color",
    "rgb(244, 236, 216)",
  );

  // The accessibilityLabel names the disc for assistive tech, and the size prop
  // drives the rendered circle (size={48} → a 48x48 disc).
  const sized = page.locator('[aria-label="Vivienne Archer"]');
  await expect(sized).toBeVisible();
  const box = await sized.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(47);
  expect(box?.width).toBeLessThanOrEqual(49);
  expect(box?.height).toBeGreaterThanOrEqual(47);
  expect(box?.height).toBeLessThanOrEqual(49);
});

test("spinner renders an accessible, continuously rotating loading indicator", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=spinner-examples--loading-states");

  const spinner = page.getByRole("progressbar", { name: "Loading" }).first();
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute("aria-busy", "true");

  // The default md spinner is a 24px ring. Its box stays stable because only the
  // inner ring rotates, not the labelled container (a rotating square's
  // axis-aligned box would otherwise oscillate).
  const box = await spinner.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(23);
  expect(box?.width).toBeLessThanOrEqual(25);

  // The leading arc is a distinct SVG stroke painted in the theme primary, not a
  // uniform ring, so the moving segment stays visible (also on native).
  await expect(
    spinner.locator('circle[stroke="#4f7864"]').first(),
  ).toBeAttached();

  // The ring genuinely spins: its transform matrix keeps advancing, so a later
  // sample differs from the first one.
  const readRingTransform = () =>
    spinner.evaluate((node) => {
      const ring = node.firstElementChild as HTMLElement | null;
      return ring ? getComputedStyle(ring).transform : "none";
    });
  const firstTransform = await readRingTransform();
  await expect.poll(readRingTransform).not.toBe(firstTransform);
});

test("animated border renders a continuously moving SVG trail", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=animatedborder-examples--active-icon");

  // The decorative border overlay is keyed by testID (RNW → data-testid).
  const border = page.locator('[data-testid="animated-border"]').first();
  await expect(border).toBeAttached();

  // The trail is real SVG geometry stroked in the theme primary, not a CSS
  // border — so it follows the rounded-rect corner on native and web alike.
  await expect(border.locator('rect[stroke="#4f7864"]').first()).toBeAttached();

  // It genuinely animates: the leading rect's stroke-dashoffset keeps advancing,
  // so a later sample differs from the first. This also guards the regression
  // where the array `style` that `Animated.createAnimatedComponent` injects
  // crashed the render with "Indexed property setter is not supported".
  const readOffset = () =>
    border.locator("rect").first().getAttribute("stroke-dashoffset");
  const firstOffset = await readOffset();
  await expect.poll(readOffset).not.toBe(firstOffset);
});

test("animated border shape=circle fully rounds the box (circle and pill)", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=animatedborder-examples--circles");

  // The first framed avatar is a 28px square, so shape="circle" fully rounds it
  // into a true circle: a rect whose corner radius is the maximum
  // (28 - 1.2 stroke) / 2 = 13.4, which SVG renders as a perfect circle.
  const disc = page.locator('[data-testid="animated-border"]').first();
  await expect(disc).toBeAttached();
  const discHead = disc.locator('rect[stroke="#4f7864"]').first();
  await expect(discHead).toBeAttached();
  await expect(discHead).toHaveAttribute("rx", "13.4");
  await expect(discHead).toHaveAttribute("width", "26.8");
  await expect(discHead).toHaveAttribute("height", "26.8");

  // The last framed box is a non-square 72×40, so shape="circle" traces an
  // elongated stadium/"pill": the same maximal radius (half the SHORTER side =
  // 19.4) but a rect spanning the FULL width (72 - 1.2 = 70.8), not a small
  // centered circle. This is the regression the fix targets.
  const pill = page.locator('[data-testid="animated-border"]').last();
  const pillHead = pill.locator('rect[stroke="#4f7864"]').first();
  await expect(pillHead).toHaveAttribute("rx", "19.4");
  await expect(pillHead).toHaveAttribute("width", "70.8");
  await expect(pillHead).toHaveAttribute("height", "38.8");

  // It genuinely animates: the leading rect's stroke-dashoffset keeps advancing
  // around the path, so a later sample differs from the first.
  const readOffset = () =>
    disc.locator("rect").first().getAttribute("stroke-dashoffset");
  const firstOffset = await readOffset();
  await expect.poll(readOffset).not.toBe(firstOffset);
});

test("button reflects press and disabled state", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  // Exact match so "Save" does not also resolve the "Saved" button.
  const save = page.getByRole("button", { exact: true, name: "Save" });
  await expect(save).toBeVisible();
  // A button without an enabled handler is exposed as disabled.
  await expect(
    page.getByRole("button", { name: "Unavailable" }),
  ).toBeDisabled();

  // Pressing the primary button swaps its label.
  await save.click();
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Save" }),
  ).toBeHidden();
});

test("button deepens its fill on hover, per tone", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--tones");

  const primary = page.getByRole("button", { name: "Primary" });
  const secondary = page.getByRole("button", { name: "Secondary" });
  const ghost = page.getByRole("button", { name: "Ghost" });
  const danger = page.getByRole("button", { name: "Danger" });

  // Resting: the primary tone carries the theme primary fill.
  await expect(primary).toHaveCSS("background-color", "rgb(79, 120, 100)");

  // Hover deepens the filled tone to primaryDeep (raising the white label's
  // contrast), and washes the neutral / ghost tones with their token: soft for
  // the secondary, the primary accent's primarySoft for ghost.
  await primary.hover();
  await expect(primary).toHaveCSS("background-color", "rgb(47, 89, 69)");
  await secondary.hover();
  await expect(secondary).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await ghost.hover();
  await expect(ghost).toHaveCSS("background-color", "rgb(227, 238, 230)");
  // Danger keeps its surface fill (a wash would drop the rose label below AA)
  // and instead firms its border from roseSoft to full rose (rgb(168, 79, 69)).
  await danger.hover();
  await expect(danger).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(danger).toHaveCSS("border-top-color", "rgb(168, 79, 69)");
});

test("disabled button does not take a hover fill", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--block-and-disabled");

  const disabled = page.getByRole("button", { name: "Disabled" });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // Hovering a disabled button leaves its surface fill untouched.
  await disabled.hover({ force: true });
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("button activates from the keyboard", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button activates with the Space key", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button with icons renders its labelled actions", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--with-icons");

  await expect(page.getByRole("button", { name: "Add account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
});

test("button sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--sizes");

  const small = await page.getByRole("button", { name: "Small" }).boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium" })
    .boundingBox();
  const large = await page.getByRole("button", { name: "Large" }).boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // sm / md / lg map to 30 / 38 / 46px tall buttons.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("inline button collapses its margin box to the label line height", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--inline");

  // The first "Restore" chip is a default md/secondary inline button. Its visible
  // pill (border box) is deliberately taller than a line of text, but its OUTER
  // (margin) box — border box plus the negative vertical margins — collapses to
  // exactly the md label line height (16px). That collapse is what keeps the chip
  // from adding any height to the row it flows in; the pill just overflows the
  // text line above and below.
  const chip = page.getByRole("button", { name: "Restore" }).first();
  const box = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      borderBox: rect.height,
      marginBox:
        rect.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom),
    };
  });

  // The margin box is the md label line height (16px). Pins the negative-margin
  // math, including the +1px-per-side base-border cancellation: dropping it would
  // leave the margin box at ~18px and fail here.
  expect(Math.abs(box.marginBox - 16)).toBeLessThanOrEqual(1);
  // The visible pill is meaningfully taller than that collapsed footprint — it
  // overflows the text line rather than growing it.
  expect(box.borderBox).toBeGreaterThan(box.marginBox + 2);
});

test("input sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=input-examples--field-sizes");

  const small = await page.getByLabel("Small field").boundingBox();
  const medium = await page.getByLabel("Medium field").boundingBox();
  const large = await page.getByLabel("Large field").boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // getByLabel resolves the inner TextInput, whose height is the size's input
  // height (30 / 38 / 46) inside the 32 / 40 / 48px box.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("switch sizes step the touch target across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=switch-examples--sizes");

  const small = await page
    .getByRole("switch", { name: "Small switch" })
    .boundingBox();
  const medium = await page
    .getByRole("switch", { name: "Medium switch" })
    .boundingBox();
  const large = await page
    .getByRole("switch", { name: "Large switch" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // sm / md / lg keep a 40 / 44 / 48px touch target around the track.
  expect(Math.abs((small?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 44)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("dropdown selector sizes step the field height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--selector-sizes");

  const small = await page
    .getByRole("button", { name: "Small selector, Standard" })
    .boundingBox();
  const medium = await page
    .getByRole("button", { name: "Medium selector, Standard" })
    .boundingBox();
  const large = await page
    .getByRole("button", { name: "Large selector, Standard" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The field variant reuses the input box scale: 32 / 40 / 48px tall.
  expect(Math.abs((small?.height ?? 0) - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 40)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 48)).toBeLessThanOrEqual(1);
});

test("date field sizes step the trigger height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=date-examples--date-field-sizes");

  const small = await page.getByLabel("Small").boundingBox();
  const medium = await page.getByLabel("Medium").boundingBox();
  const large = await page.getByLabel("Large").boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The web trigger is an InputFrame, so getByLabel resolves the inner input at
  // the same 30 / 38 / 46px input heights as the plain text field.
  expect(Math.abs((small?.height ?? 0) - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs((medium?.height ?? 0) - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((large?.height ?? 0) - 46)).toBeLessThanOrEqual(1);
});

test("segmented control sizes step the control height across the shared scale", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=segmented-examples--sizes");

  const small = await page
    .getByRole("radiogroup", { name: "Small report" })
    .boundingBox();
  const medium = await page
    .getByRole("radiogroup", { name: "Medium report" })
    .boundingBox();
  const large = await page
    .getByRole("radiogroup", { name: "Large report" })
    .boundingBox();

  expect(small).not.toBeNull();
  expect(medium).not.toBeNull();
  expect(large).not.toBeNull();
  // The segment padding and type scale grow with the size, so the rendered
  // control height increases monotonically (exact px depends on font metrics).
  expect(small?.height ?? 0).toBeGreaterThan(0);
  expect(medium?.height ?? 0).toBeGreaterThan(small?.height ?? 0);
  expect(large?.height ?? 0).toBeGreaterThan(medium?.height ?? 0);
});

async function dropdownScrollState(page: Page, label: string) {
  // The selector's scrollable rows are listbox options (`role="option"`), not
  // buttons; the row element itself is the scroll-into-view target.
  return page
    .getByRole("option", { exact: true, name: label })
    .evaluate((element) => {
      let scrollParent = element.parentElement;
      while (scrollParent) {
        if (scrollParent.scrollHeight > scrollParent.clientHeight) {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent) {
        return { activeInView: false, scrolled: false };
      }
      const activeRect = element.getBoundingClientRect();
      const viewportRect = scrollParent.getBoundingClientRect();
      return {
        activeInView:
          activeRect.top >= viewportRect.top - 1 &&
          activeRect.bottom <= viewportRect.bottom + 1,
        scrolled: scrollParent.scrollTop > 0,
      };
    });
}

test("toast appears on trigger, announces its tone, and dismisses on close", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--tones");

  await page.getByRole("button", { name: "Show success" }).click();
  const success = page.getByText("Saved", { exact: true });
  await expect(success).toBeVisible();
  // The success toast is a polite status region.
  await expect(
    page.getByRole("status").filter({ hasText: "Saved" }),
  ).toBeVisible();

  // Errors render as an assertive alert and stack alongside the success toast.
  await page.getByRole("button", { name: "Show error" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Save failed" }),
  ).toBeVisible();
  await expect(success).toBeVisible();

  // The close control dismisses just its own toast.
  await page.getByRole("button", { name: "Dismiss Saved" }).click();
  await expect(success).toBeHidden();
  await expect(
    page
      .getByRole("region", { name: "Notifications" })
      .getByText("Save failed"),
  ).toBeVisible();
});

test("toast action runs and dismisses the toast", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--with-action");

  await page.getByRole("button", { name: "Delete invoice" }).click();
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Invoice deleted");
  await expect(toast).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toBeHidden();
});

test("toast auto-dismisses after its duration elapses", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--auto-dismiss");

  await page.getByRole("button", { name: "Copy link" }).click();
  // Move the pointer off the toast so hover does not pause the countdown.
  await page.mouse.move(0, 0);
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Copied to clipboard");
  await expect(toast).toBeVisible();
  // Duration is 2s; allow margin for the auto-dismiss to fire.
  await expect(toast).toBeHidden({ timeout: 5000 });
});

test("top-center toast pins to the top of the viewport", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--top-center");

  await page.getByRole("button", { name: "Show info" }).click();
  const heading = page.getByText("Heads up", { exact: true });
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.y ?? Number.MAX_SAFE_INTEGER).toBeLessThan(200);
});

test("solid toast variant can be triggered through the controller", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--solid-bottom-center");

  await page.getByRole("button", { name: "Show solid error" }).click();
  const toast = page
    .getByRole("alert")
    .filter({ hasText: "Couldn't move this transaction. Try again." });
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dismiss Couldn't move/ }),
  ).toHaveCount(0);

  const background = await toast.evaluate(
    (node) => window.getComputedStyle(node as HTMLElement).backgroundColor,
  );
  expect(background).toBe("rgb(168, 79, 69)");

  const box = await toast.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    const toastCenter = box.x + box.width / 2;
    expect(box.width).toBeGreaterThan(260);
    expect(box.height).toBeLessThan(80);
    expect(Math.abs(toastCenter - viewport.width / 2)).toBeLessThan(20);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
  }

  await page.getByRole("button", { name: "Show description" }).click();
  const descriptionToast = page
    .getByRole("alert")
    .filter({ hasText: "Transaction not moved" });
  await expect(descriptionToast).toContainText(
    "Check the category and try again.",
  );

  await page.getByRole("button", { name: "Show action" }).click();
  const actionToast = page
    .getByRole("alert")
    .filter({ hasText: "Move failed" });
  await expect(actionToast).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(actionToast).toBeHidden();

  await page.getByRole("button", { name: "Show close" }).click();
  const closeToast = page
    .getByRole("status")
    .filter({ hasText: "Saved as draft" });
  await expect(closeToast).toBeVisible();
  await page.getByRole("button", { name: "Dismiss Saved as draft" }).click();
  await expect(closeToast).toBeHidden();
});

test("solid toast accepts a custom icon for compact progress feedback", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--icon-bottom-center");

  await page.getByRole("button", { name: "Show saving status" }).click();
  const toast = page
    .getByRole("status")
    .filter({ hasText: "Saving payslips to your device • 3 of 5" });
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dismiss Saving payslips/ }),
  ).toHaveCount(0);

  const background = await toast.evaluate(
    (node) => window.getComputedStyle(node as HTMLElement).backgroundColor,
  );
  expect(background).toBe("rgb(28, 31, 29)");

  const box = await toast.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    const toastCenter = box.x + box.width / 2;
    expect(box.width).toBeGreaterThan(360);
    expect(box.height).toBeGreaterThanOrEqual(60);
    expect(Math.abs(toastCenter - viewport.width / 2)).toBeLessThan(20);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 48);
  }
});

test("toast controller is registered before descendant mount effects", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--controller-on-mount");

  const toast = page
    .getByRole("status")
    .filter({ hasText: "Mounted through controller" });
  await expect(toast).toBeVisible();
});

test("hovering a toast pauses its auto-dismiss countdown", async ({ page }) => {
  await page.goto("/iframe.html?id=toast-examples--auto-dismiss");

  await page.getByRole("button", { name: "Copy link" }).click();
  const toast = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Copied to clipboard");
  await expect(toast).toBeVisible();

  // Hold the pointer over the 2s toast well past its duration; the pause keeps
  // it alive instead of letting the countdown fire.
  await toast.hover();
  await page.waitForTimeout(2600);
  await expect(toast).toBeVisible();

  // Releasing the hover resumes the (now nearly elapsed) countdown.
  await page.mouse.move(0, 0);
  await expect(toast).toBeHidden();
});

test("non-dismissible toast has no close control and dismissAll clears the queue", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=toast-examples--queue-and-dismiss-all");

  await page.getByRole("button", { name: "Start upload" }).click();
  await page.getByRole("button", { name: "Start upload" }).click();
  const uploading = page
    .getByRole("region", { name: "Notifications" })
    .getByText("Uploading…");
  await expect(uploading.first()).toBeVisible();
  // A non-dismissible toast renders no close control.
  await expect(
    page.getByRole("button", { name: /Dismiss Uploading/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Dismiss all" }).click();
  await expect(
    page.getByRole("region", { name: "Notifications" }).getByText("Uploading…"),
  ).toHaveCount(0);
});

test("calendar switches between month, week, and day views", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=calendar-examples--switchable-calendar");

  // The month view leads with the weekday header row (no time gutter yet).
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  await expect(page.getByText("All-day", { exact: true })).toBeHidden();

  // Switching to the week view swaps in the time grid (its all-day gutter and
  // hour labels appear); the segment is a radio in the SegmentedControl.
  await page.getByRole("radio", { name: "Week" }).click();
  await expect(page.getByRole("radio", { name: "Week" })).toBeChecked();
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(page.getByText("9 AM", { exact: true })).toBeVisible();

  // The week view carries a date header above the columns: each column shows its
  // weekday + day number (today's 2026-06-17 reads "Wed 17").
  await expect(page.getByTestId("calendar-col-header-2026-06-17")).toHaveText(
    "Wed17",
  );
  await expect(page.getByTestId("calendar-col-header-2026-06-15")).toHaveText(
    "Mon15",
  );

  // The day view keeps the time grid but collapses to a single column.
  await page.getByRole("radio", { name: "Day" }).click();
  await expect(page.getByRole("radio", { name: "Day" })).toBeChecked();
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("calendar-day-column-2026-06-17"),
  ).toBeVisible();

  // Back to the month view: the weekday header returns and the gutter is gone.
  await page.getByRole("radio", { name: "Month" }).click();
  await expect(page.getByRole("radio", { name: "Month" })).toBeChecked();
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  await expect(page.getByText("All-day", { exact: true })).toBeHidden();
});

test("calendar enforced view hides the switcher", async ({ page }) => {
  await page.goto("/iframe.html?id=calendar-examples--enforced-week-calendar");

  // The week view renders (its time gutter is present)...
  await expect(page.getByText("All-day", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("calendar-day-column-2026-06-17"),
  ).toBeVisible();

  // ...but with a single enforced view there is no switcher at all.
  await expect(page.getByRole("radio", { name: "Week" })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Month" })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Day" })).toBeHidden();
});

test("calendar expands recurring events", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=calendar-examples--recurring-events-calendar",
  );

  // The month view is visible (weekday header present).
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();

  // The daily standup expands onto many cells across the month, so its chip
  // appears far more than once.
  await expect
    .poll(async () => page.getByText("Daily standup").count())
    .toBeGreaterThanOrEqual(10);

  // The weekly Tue/Thu sync also lands on multiple days in the visible month.
  await expect
    .poll(async () => page.getByText("Weekly sync").count())
    .toBeGreaterThanOrEqual(4);
});

test("calendar drag creates a timed event", async ({ page }) => {
  await page.goto("/iframe.html?id=calendar-examples--drag-to-create-calendar");

  // Before any drag the log shows the idle hint and no event blocks exist.
  const log = page.getByTestId("created-event-log");
  await expect(log).toHaveText("Drag the grid to create an event");

  const column = page.getByTestId("calendar-day-column-2026-06-17");
  const box = await column.boundingBox();
  expect(box).not.toBeNull();

  // Drag vertically down the day column to sweep out a multi-slot range, using
  // the same page.mouse pointer-drag idiom as the drag-select tests.
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const startY = (box?.y ?? 0) + 60;
  const endY = (box?.y ?? 0) + 180;
  await page.mouse.move(x, startY);
  await page.mouse.down();
  await page.mouse.move(x, endY, { steps: 10 });
  await page.mouse.up();

  // The log now reports a created timed range (start/end ISO datetimes), and a
  // new "New event" block is positioned in the grid.
  await expect(log).toContainText("Created");
  await expect(log).toContainText("2026-06-17T");
  await expect(
    page.getByRole("button", { name: /New event/ }).first(),
  ).toBeVisible();
});

test("calendar month view creates events by click and by drag across days", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=calendar-examples--month-drag-to-create-calendar",
  );

  const log = page.getByTestId("created-event-log");
  await expect(log).toHaveText(
    "Click a day, or drag across days, to create an event",
  );

  // The grid disables text selection so a drag never blue-highlights the day
  // numbers / event labels (the cascade reaches the day-number text too).
  const cell = page.getByTestId("calendar-month-cell-2026-06-10");
  expect(await cell.evaluate((el) => getComputedStyle(el).userSelect)).toBe(
    "none",
  );

  // A plain click on a day cell creates a single-day all-day event.
  await cell.click();
  await expect(log).toContainText("Created 2026-06-10 – 2026-06-10");

  // Dragging across several day cells creates a multi-day all-day event, using
  // the same page.mouse pointer-drag idiom as the drag-select tests.
  const startCell = page.getByTestId("calendar-month-cell-2026-06-16");
  const endCell = page.getByTestId("calendar-month-cell-2026-06-18");
  const startBox = await startCell.boundingBox();
  const endBox = await endCell.boundingBox();
  expect(startBox).not.toBeNull();
  expect(endBox).not.toBeNull();

  await page.mouse.move(
    (startBox?.x ?? 0) + (startBox?.width ?? 0) / 2,
    (startBox?.y ?? 0) + (startBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (endBox?.x ?? 0) + (endBox?.width ?? 0) / 2,
    (endBox?.y ?? 0) + (endBox?.height ?? 0) / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  // The log reports the multi-day all-day range, and the new event renders as a
  // labelled "New event" spanning bar.
  await expect(log).toContainText("Created 2026-06-16 – 2026-06-18");
  await expect(
    page.getByRole("button", { name: /New event/ }).first(),
  ).toBeVisible();
});

test("heatmap labels the months across a full-year range", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-year");

  // A year range labels every month at the column where it begins.
  await expect(page.getByText("Jan", { exact: true })).toBeVisible();
  await expect(page.getByText("Jul", { exact: true })).toBeVisible();
  await expect(page.getByText("Dec", { exact: true })).toBeVisible();
});

test("heatmap reports the pressed cell to its handler", async ({ page }) => {
  await page.goto("/iframe.html?id=heatmap-examples--heatmap-interactive");

  await expect(page.getByText("None selected")).toBeVisible();
  // Each in-range cell is a button named by its accessible date + value label.
  await page.getByRole("button", { name: "15 Jan 2024: 8 (high)" }).click();
  await expect(page.getByText("Selected: 2024-01-15 (8)")).toBeVisible();
});

test("table row opens on click and reports the opened row", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // With onRowPress, each row is a button named by its rowLabel.
  const paid = page.getByRole("button", { name: "Open invoice INV-0007" });
  await expect(paid).toBeVisible();
  await paid.click();
  await expect(page.getByText("Opened INV-0007")).toBeVisible();
});

test("table row activates from the keyboard", async ({ page }) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // The button-role row is keyboard operable via react-native-web's Pressable.
  const overdue = page.getByRole("button", { name: "Open invoice INV-0008" });
  await overdue.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Opened INV-0008")).toBeVisible();
});

test("table disabled row is exposed as a non-pressable button", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--clickable-rows");

  // The draft row is marked non-pressable via rowDisabled.
  await expect(
    page.getByRole("button", { name: "Open invoice INV-0009" }),
  ).toBeDisabled();
});

test("table rich cells render and the per-row Open action fires", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=table-examples--rich-cells");

  // Rich cells render: a two-line name cell and a toned status badge.
  await expect(page.getByText("Maya Okafor")).toBeVisible();
  await expect(page.getByText("Leaving 31 May")).toBeVisible();

  // The per-row action button (in the headerless action column) fires.
  await page.getByRole("button", { name: "Open Maya Okafor" }).click();
  await expect(page.getByText("Opened Maya Okafor")).toBeVisible();
});

test("kanban card drags to another column with the pointer", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const drafted = page.getByTestId("kanban-column-drafted");
  const approved = page.getByTestId("kanban-column-approved");
  // The card starts in the Drafted column.
  await expect(drafted.getByTestId("kanban-card-c1")).toBeVisible();

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const targetBox = await approved.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    // Aim near the bottom of the column (past its last card) so the drop lands
    // at the end of the Approved list; the 24px inset clears the column padding.
    (targetBox?.x ?? 0) + (targetBox?.width ?? 0) / 2,
    (targetBox?.y ?? 0) + (targetBox?.height ?? 0) - 24,
    { steps: 12 },
  );
  await page.mouse.up();

  // It now lives under the Approved column, the move was reported, and the drag
  // did NOT also fire the card's onCardPress (the post-drag click is suppressed).
  await expect(approved.getByTestId("kanban-card-c1")).toBeVisible();
  await expect(drafted.getByTestId("kanban-card-c1")).toHaveCount(0);
  await expect(page.getByText(/Moved c1 to approved/)).toBeVisible();
  await expect(page.getByText(/Opened/)).toHaveCount(0);
});

test("kanban shows a floating clone and a drop preview while dragging", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const approvedBox = await page
    .getByTestId("kanban-column-approved")
    .boundingBox();
  expect(cardBox).not.toBeNull();
  expect(approvedBox).not.toBeNull();

  // Press and hold a drag over the Approved column, without releasing.
  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (approvedBox?.x ?? 0) + (approvedBox?.width ?? 0) / 2,
    (approvedBox?.y ?? 0) + 60,
    { steps: 10 },
  );

  // The card is lifted out of the flow, a clone rides the cursor, and a
  // translucent preview marks where it would land.
  await expect(page.getByTestId("kanban-drag-ghost")).toBeVisible();
  await expect(page.getByTestId("kanban-drop-preview")).toBeVisible();
  await expect(page.getByTestId("kanban-card-c1")).toHaveCount(0);

  await page.mouse.up();

  // After the drop the clone and preview are gone and the card is placed.
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);
  await expect(page.getByTestId("kanban-drop-preview")).toHaveCount(0);
  await expect(
    page.getByTestId("kanban-column-approved").getByTestId("kanban-card-c1"),
  ).toBeVisible();
});

test("kanban ghost keeps viewport coordinates inside a transformed scroller", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const board = page.getByRole("group", { name: "Content board" });
  const scrollerState = await board.evaluate((element) => {
    const scroller = element.parentElement;
    if (!scroller) {
      throw new Error("Kanban story is missing its host element");
    }
    Object.assign(scroller.style, {
      height: "420px",
      overflow: "auto",
      padding: "96px 72px 240px",
      transform: "translateZ(0)",
    });
    scroller.scrollTop = 48;
    return {
      scrollTop: scroller.scrollTop,
      scrollable: scroller.scrollHeight > scroller.clientHeight,
      transform: getComputedStyle(scroller).transform,
    };
  });
  expect(scrollerState.scrollable).toBe(true);
  expect(scrollerState.scrollTop).toBeGreaterThan(0);
  expect(scrollerState.transform).not.toBe("none");

  const cardBox = await page.getByTestId("kanban-card-c1").boundingBox();
  const approvedBox = await page
    .getByTestId("kanban-column-approved")
    .boundingBox();
  expect(cardBox).not.toBeNull();
  expect(approvedBox).not.toBeNull();

  const pointerX = (approvedBox?.x ?? 0) + (approvedBox?.width ?? 0) / 2;
  const pointerY = (approvedBox?.y ?? 0) + 80;
  await page.mouse.move(
    (cardBox?.x ?? 0) + (cardBox?.width ?? 0) / 2,
    (cardBox?.y ?? 0) + (cardBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(pointerX, pointerY, { steps: 10 });

  const ghost = page.getByTestId("kanban-drag-ghost");
  await expect(ghost).toBeVisible();
  expect(
    await ghost.evaluate((element) => element.parentElement === document.body),
  ).toBe(true);
  const ghostBox = await ghost.boundingBox();
  expect(ghostBox).not.toBeNull();
  expect(
    Math.abs((ghostBox?.x ?? 0) + (ghostBox?.width ?? 0) / 2 - pointerX),
  ).toBeLessThan(2);
  expect(
    Math.abs((ghostBox?.y ?? 0) + (ghostBox?.height ?? 0) / 2 - pointerY),
  ).toBeLessThan(2);

  await page.mouse.up();
});

test("kanban clicking a draggable card opens it instead of moving it", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  // A plain click (no drag past the threshold) fires onCardPress, not a move.
  await page.getByTestId("kanban-card-c3").click();
  await expect(page.getByText("Opened c3")).toBeVisible();
  await expect(
    page.getByTestId("kanban-column-approved").getByTestId("kanban-card-c3"),
  ).toBeVisible();
});

test("kanban a drag that lands back home does not open the card", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  // Drag c3 within its own column and release at the same slot: a real drag
  // (past the threshold) that is a no-op move must still suppress onCardPress.
  const box = await page.getByTestId("kanban-card-c3").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2 + 24,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect(page.getByText(/Opened/)).toHaveCount(0);
  await expect(page.getByText(/Moved/)).toHaveCount(0);
});

test("kanban card moves between columns with the keyboard", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const approved = page.getByTestId("kanban-column-approved");
  await page.getByTestId("kanban-card-c2").focus();
  await page.keyboard.press("Space"); // grab
  await page.keyboard.press("ArrowRight"); // move to the next column
  await page.keyboard.press("Enter"); // drop (Enter and Space both drop)

  await expect(approved.getByTestId("kanban-card-c2")).toBeVisible();
  await expect(page.getByText(/Moved c2 to approved/)).toBeVisible();
  // Focus is restored to the moved card so keyboard users keep their place.
  await expect(page.getByTestId("kanban-card-c2")).toBeFocused();
});

test("kanban keyboard drag cancels on Escape without moving", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--drag-and-drop");

  const drafted = page.getByTestId("kanban-column-drafted");
  await page.getByTestId("kanban-card-c2").focus();
  await page.keyboard.press("Space"); // grab
  await page.keyboard.press("ArrowRight"); // move to the next column
  await page.keyboard.press("Escape"); // cancel

  // The card stays put, no move was reported, and focus returns to the card.
  await expect(drafted.getByTestId("kanban-card-c2")).toBeVisible();
  await expect(page.getByText(/Moved c2/)).toHaveCount(0);
  await expect(page.getByTestId("kanban-card-c2")).toBeFocused();
});

test("kanban renders a header accessory per column, before the add button", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  // The render prop runs per column: a toggle on the first two, `null` on the
  // terminal one.
  await expect(
    board.getByRole("switch", { name: "Agent for Drafted" }),
  ).toBeVisible();
  await expect(
    board.getByRole("switch", { name: "Agent for Approved" }),
  ).toBeVisible();
  await expect(
    board.getByRole("switch", { name: "Agent for Published" }),
  ).toHaveCount(0);

  // The accessory column's header is chip, count, accessory, add button — in
  // that order — and the accessory is pushed to the trailing edge rather than
  // sitting against the count.
  const header = await board
    .getByTestId("kanban-column-drafted")
    .evaluate((column) => {
      const row = column.firstElementChild as HTMLElement;
      return Array.from(row.children).map((node) => ({
        hasSwitch: Boolean(node.querySelector('[role="switch"]')),
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
        role: node.getAttribute("role"),
        text: node.textContent,
      }));
    });
  expect(header).toHaveLength(4);
  expect(header[0].text).toBe("Drafted");
  expect(header[1].text).toBe("2");
  expect(header[2].hasSwitch).toBe(true);
  expect(header[3].role).toBe("button");
  expect(header[2].left).toBeGreaterThan(header[1].right + 20);
});

test("kanban column with no accessory keeps its original header nodes", async ({
  page,
}) => {
  const headerChildren = (testID: string) =>
    page
      .getByTestId(testID)
      .first()
      .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);

  // A board that never passes the prop: chip + count + add button.
  await page.goto("/iframe.html?id=kanban-examples--add-and-empty");
  const baselineWithAdd = await headerChildren("kanban-column-published");
  expect(baselineWithAdd).toBe(3);
  // And with no add button either: chip + count.
  await page.goto("/iframe.html?id=kanban-examples--grouped-by-status");
  const baselinePlain = await headerChildren("kanban-column-published");
  expect(baselinePlain).toBe(2);

  // A column whose `renderColumnAccessory` returns `null` adds no header node,
  // with or without the add button.
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");
  const withAdd = await page
    .getByRole("group", { name: "Content board" })
    .getByTestId("kanban-column-published")
    .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);
  expect(withAdd).toBe(baselineWithAdd);
  const plain = await page
    .getByRole("group", { name: "Agent board (md)" })
    .getByTestId("kanban-column-published")
    .evaluate((column) => column.firstElementChild?.childElementCount ?? -1);
  expect(plain).toBe(baselinePlain);
});

test("kanban header accessory never changes the header height", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  // The slot is capped at the header's content box and clips, so an accessory
  // cannot stretch the header; it also never shrinks under a narrow column.
  const slot = await page
    .getByRole("group", { name: "Content board" })
    .getByTestId("kanban-column-drafted")
    .evaluate((column) => {
      const node = (column.firstElementChild as HTMLElement)
        .children[2] as HTMLElement;
      const style = getComputedStyle(node);
      return {
        flexShrink: style.flexShrink,
        maxHeight: style.maxHeight,
        overflow: style.overflow,
      };
    });
  expect(slot).toEqual({
    flexShrink: "0",
    maxHeight: "20px",
    overflow: "hidden",
  });

  // At every size, the accessory column's header is exactly as tall as the
  // header of a column that renders no accessory.
  for (const size of ["sm", "md", "lg"] as const) {
    const board = page.getByRole("group", { name: `Agent board (${size})` });
    const heights = await Promise.all(
      ["drafted", "published"].map((id) =>
        board
          .getByTestId(`kanban-column-${id}`)
          .evaluate(
            (column) =>
              column.firstElementChild?.getBoundingClientRect().height ?? -1,
          ),
      ),
    );
    expect(heights[0]).toBeCloseTo(heights[1], 1);
  }
});

test("kanban header accessory is inert to the board's press and drag", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const toggle = board.getByRole("switch", { name: "Agent for Drafted" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();

  // The accessory owns its own state; the click never reached a card handler,
  // started a drag, or tripped the post-drag press suppression.
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);

  // A card press still works right after, so nothing was left suppressed.
  await board.getByTestId("kanban-card-c1").click();
  await expect(page.getByText("Opened c1")).toBeVisible();
});

test("kanban header accessory is a keyboard-operable tab stop with a visible ring", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const toggle = board.getByRole("switch", { name: "Agent for Drafted" });

  // A focusable accessory sits in the natural DOM order: after the count and
  // before the add button, so Tab reaches the add button next.
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    board.getByRole("button", { name: "Add card to Drafted" }),
  ).toBeFocused();

  // The slot clips, so an accessory needs an inset indicator — the browser's
  // outset outline would be cropped away (WCAG 2.1 — 2.4.7).
  await toggle.focus();
  const focusStyle = await toggle.evaluate((node) => {
    const style = getComputedStyle(node);
    return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
  });
  expect(focusStyle.boxShadow).toContain("inset");
  expect(focusStyle.outlineStyle).toBe("none");

  // The accessory brings its own keyboard handling: react-native-web presses
  // Enter for any role but binds Space to `button` roles only, so a `switch`
  // has to wire Space itself. Both must toggle exactly once.
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  // Keyboard use of the accessory never reaches the board either.
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
});

test("kanban a pointer drag from the accessory never grabs a card", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=kanban-examples--column-accessory");

  const board = page.getByRole("group", { name: "Content board" });
  const box = await board
    .getByRole("switch", { name: "Agent for Drafted" })
    .boundingBox();
  expect(box).not.toBeNull();

  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 200, { steps: 12 });

  // The header is outside the board's card geometry, so no card is picked up.
  await expect(page.getByTestId("kanban-drag-ghost")).toHaveCount(0);
  await expect(page.getByTestId("kanban-drop-preview")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByText(/^Moved /)).toHaveCount(0);
  await expect(page.getByText(/^Opened /)).toHaveCount(0);
});
