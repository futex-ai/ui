import { expect, test } from "@playwright/test";

/**
 * The platform primitives, driven directly.
 *
 * `Primitives/Examples` renders `View`, `Text`, `Pressable` and `Image` on
 * their own; this spec asserts the behaviours the DOM backend
 * (`src/primitives/dom`) has to reproduce from `react-native-web`, so a
 * regression in the backend fails here with a pointed message rather than
 * showing up as a pixel diff in some component's screenshot.
 */

test("pressable reports hover, press and long press", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-examples--press");
  const target = page.getByTestId("press-target");
  const state = page.getByTestId("press-state");
  const log = page.getByTestId("press-log");

  await expect(state).toHaveText("pressed:false hovered:false focused:false");

  await target.hover();
  await expect(state).toHaveText("pressed:false hovered:true focused:false");

  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // The press activates after react-native-web's 50 ms `delayPressIn`, and the
  // pointer has focused the element on the way in.
  await expect(state).toHaveText("pressed:true hovered:true focused:true");
  await expect(log).toHaveText("pressin");
  await page.mouse.up();
  await expect(log).toHaveText("press");
  await expect(state).toHaveText("pressed:false hovered:true focused:true");

  // A long press runs instead of the press, and the click it would have
  // produced is cancelled.
  await page.mouse.down();
  await expect(log).toHaveText("longpress", { timeout: 2_000 });
  await page.mouse.up();
  await expect(log).toHaveText("pressout");
});

test("a secondary or modified pointer never starts a press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--press");
  const target = page.getByTestId("press-target");
  const state = page.getByTestId("press-state");
  const log = page.getByTestId("press-log");

  const box = (await target.boundingBox())!;
  const centre: [number, number] = [
    box.x + box.width / 2,
    box.y + box.height / 2,
  ];
  await page.mouse.move(...centre);
  await expect(log).toHaveText("hoverin");

  // Held long enough that the 50 ms press delay would have elapsed.
  await page.mouse.down({ button: "right" });
  await page.waitForTimeout(250);
  await expect(state).toHaveText(/^pressed:false/);
  await expect(log).toHaveText("hoverin");
  await page.mouse.up({ button: "right" });

  await page.keyboard.down("Control");
  await page.mouse.down();
  await page.waitForTimeout(250);
  await expect(state).toHaveText(/^pressed:false/);
  await page.mouse.up();
  await page.keyboard.up("Control");
});

test("hover listeners never run a stale callback", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-examples--press");
  const target = page.getByTestId("press-target");
  const log = page.getByTestId("press-log");

  await target.hover();
  await expect(log).toHaveText("hoverin");
  // Re-renders while hovered, which is what gives `onHoverOut` a new identity.
  await target.click();
  await expect(log).toHaveText("press");
  await page.mouse.move(0, 0);
  await expect(log).toHaveText("hoverout after press");
});

test("pressable activates from the keyboard and reports focus", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--press");
  const target = page.getByTestId("press-target");
  const state = page.getByTestId("press-state");

  await target.focus();
  await expect(state).toHaveText("pressed:false hovered:false focused:true");
  await expect(target).toHaveAttribute("tabindex", "0");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("press-log")).toHaveText("press");
});

test("numberOfLines clamps to one line and to a line count", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--clamped-text");

  const one = page.getByTestId("clamp-one");
  await expect(one).toHaveCSS("white-space", "nowrap");
  await expect(one).toHaveCSS("text-overflow", "ellipsis");
  await expect(one).toHaveCSS("overflow-x", "hidden");

  // `display: -webkit-box` is what is written, but Chromium now reports the
  // blockified used value, so the clamp itself is what gets asserted.
  const two = page.getByTestId("clamp-two");
  await expect(two).toHaveCSS("-webkit-line-clamp", "2");
  await expect(two).toHaveCSS("-webkit-box-orient", "vertical");
  await expect(two).toHaveCSS("overflow-x", "clip");
  // Two lines are taller than one, and both are shorter than the unclamped run.
  const heights = await Promise.all(
    ["clamp-one", "clamp-two", "clamp-none"].map(
      async (id) => (await page.getByTestId(id).boundingBox())!.height,
    ),
  );
  expect(heights[1]).toBeGreaterThan(heights[0]);
  expect(heights[2]).toBeGreaterThan(heights[1]);

  await expect(page.getByTestId("clamp-none")).toHaveCSS("user-select", "none");
});

test("nested text inherits colour and font from its ancestor", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--nested-text");

  const root = page.getByTestId("nested-root");
  const child = page.getByTestId("nested-child");
  const override = page.getByTestId("nested-override");

  // A root text is a block with an inferred direction; a nested one is a span.
  expect(await root.evaluate((node) => node.tagName)).toBe("DIV");
  await expect(root).toHaveAttribute("dir", "auto");
  expect(await child.evaluate((node) => node.tagName)).toBe("SPAN");

  await expect(root).toHaveCSS("color", "rgb(31, 81, 56)");
  await expect(child).toHaveCSS("color", "rgb(31, 81, 56)");
  await expect(child).toHaveCSS("font-size", "16px");
  await expect(child).toHaveCSS("font-weight", "700");
  await expect(override).toHaveCSS("color", "rgb(74, 90, 80)");
});

test("pointerEvents box-none passes the pointer through but not its child", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--pointer-events");

  const overlay = page.getByTestId("pe-overlay");
  await expect(overlay).toHaveAttribute("data-pointer-events", "box-none");
  await expect(overlay).toHaveCSS("pointer-events", "none");
  await expect(page.getByTestId("pe-overlay-button")).toHaveCSS(
    "pointer-events",
    "auto",
  );
  await expect(page.getByTestId("pe-inert")).toHaveCSS(
    "pointer-events",
    "none",
  );

  // The point in the middle of the overlay belongs to the underlay beneath it,
  // while the overlay's own button still takes its own presses.
  const host = (await page.getByTestId("pe-underlay").boundingBox())!;
  const hit = await page.evaluate(
    ([x, y]) =>
      document
        .elementFromPoint(x, y)
        ?.closest("[data-testid]")
        ?.getAttribute("data-testid"),
    [host.x + 40, host.y + host.height / 2],
  );
  expect(hit).toBe("pe-underlay");

  const button = (await page.getByTestId("pe-overlay-button").boundingBox())!;
  const buttonHit = await page.evaluate(
    ([x, y]) =>
      document
        .elementFromPoint(x, y)
        ?.closest("[data-testid]")
        ?.getAttribute("data-testid"),
    [button.x + button.width / 2, button.y + button.height / 2],
  );
  expect(buttonHit).toBe("pe-overlay-button");
});

test("onLayout reports the measured box after mount", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-examples--layout");
  await expect(page.getByTestId("layout-size")).toHaveText("240x64");
});

test("an image renders an img with its accessible name and fit", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--image-and-roles");

  const frame = page.getByTestId("image-frame");
  await expect(frame).toHaveAttribute("role", "img");
  await expect(frame).toHaveAttribute("aria-label", "Sample frame");
  const img = frame.locator("img");
  await expect(img).toHaveCSS("object-fit", "cover");
  await expect(img).toHaveAttribute("draggable", "false");
  const size = (await img.boundingBox())!;
  expect(Math.round(size.width)).toBe(96);
  expect(Math.round(size.height)).toBe(54);
});

test("the header role picks the heading element for its level", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-examples--press");
  expect(
    await page
      .getByRole("heading", { name: "Press states" })
      .evaluate((node) => node.tagName),
  ).toBe("H1");

  await page.goto("/iframe.html?id=primitives-examples--clamped-text");
  expect(
    await page
      .getByRole("heading", { name: "Clamped text" })
      .evaluate((node) => node.tagName),
  ).toBe("H2");

  await page.goto("/iframe.html?id=primitives-examples--image-and-roles");
  expect(
    await page
      .getByRole("heading", { name: "Image and roles" })
      .evaluate((node) => node.tagName),
  ).toBe("H3");
});

test("an onLayout attached after mount still measures", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-layout--late-layout");
  const size = page.getByTestId("late-layout-size");
  await expect(size).toHaveText("unmeasured");

  // The shared observer watches a node from the moment it has a handler, not
  // only from the render that mounted it — `react-native-web`'s own
  // `useElementLayout` depended on `[ref, observer]` alone and missed this.
  await page.getByTestId("late-layout-watch").click();
  await expect(size).toHaveText("240x64");
});
