import { expect, test } from "@playwright/test";

/**
 * `TextInput`, `Animated` and the gesture responder, driven directly.
 *
 * `Primitives/Interaction` renders each with a readout, so the parts of the DOM
 * backend with no component of their own — a field's callbacks, an animated
 * value's interpolations, and the responder negotiation `PanResponder` sits on
 * — fail here with a pointed message instead of somewhere downstream.
 */

test("a field reports its text, keys, selection and submit", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--fields");
  const field = page.getByTestId("single-line");

  await expect(page.getByTestId("text-value")).toHaveText("value ");
  await field.click();
  await field.pressSequentially("abc");
  await expect(page.getByTestId("text-value")).toHaveText("value abc");
  // `onKeyPress` carries the DOM key, as `NativeRichTextBlock` reads it.
  await expect(page.getByTestId("text-key")).toHaveText("key c");

  await field.press("Enter");
  await expect(page.getByTestId("text-submitted")).toHaveText("submitted abc");
  // A single-line field blurs after a submit, as `blurOnSubmit` defaults say.
  await expect(field).not.toBeFocused();

  await field.click();
  await field.press("Home");
  await field.press("Shift+ArrowRight");
  await expect(page.getByTestId("text-selection")).toHaveText("selection 0-1");
});

test("a field renders as an input or a textarea by multiline", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--fields");
  await expect(page.getByTestId("single-line")).toHaveJSProperty(
    "tagName",
    "INPUT",
  );
  await expect(page.getByTestId("multi-line")).toHaveJSProperty(
    "tagName",
    "TEXTAREA",
  );
  // The placeholder is a real attribute, and the field is the element itself,
  // which is what `useAutoGrowTextarea.web.ts` measures.
  await expect(page.getByTestId("single-line")).toHaveAttribute(
    "placeholder",
    "Type here",
  );
});

test("a multiline field reports its content size as it grows", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--fields");
  const grown = page.getByTestId("text-grown");
  await expect(grown).toHaveText("grew 0");

  const field = page.getByTestId("multi-line");
  await field.click();
  await field.pressSequentially("one\ntwo\nthree\nfour\nfive");
  await expect(grown).not.toHaveText("grew 0");
});

test("a forwarded onKeyDown is delivered and does not bubble out", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--fields");
  // `useDocumentKeyCapture` listens on the document in the capture phase, so it
  // still sees every key; the field's own `stopPropagation` only blocks the
  // bubble phase, exactly as the previous backend's did.
  await page.evaluate(() => {
    const scope = window as unknown as {
      __bubbled: string[];
      __captured: string[];
    };
    scope.__bubbled = [];
    scope.__captured = [];
    document.addEventListener(
      "keydown",
      (event) => scope.__captured.push(event.key),
      true,
    );
    document.addEventListener("keydown", (event) =>
      scope.__bubbled.push(event.key),
    );
  });
  await page.getByTestId("single-line").click();
  await page.keyboard.press("q");
  await expect(page.getByTestId("text-value")).toHaveText("value q");

  const seen = await page.evaluate(() => {
    const scope = window as unknown as {
      __bubbled: string[];
      __captured: string[];
    };
    return { bubbled: scope.__bubbled, captured: scope.__captured };
  });
  expect(seen.captured).toEqual(["q"]);
  expect(seen.bubbled).toEqual([]);
});

test("an animated value drives its interpolations", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-interaction--motion");
  const progress = page.getByTestId("animated-progress");
  const fill = page.getByTestId("animated-track").locator("div").first();
  const spinner = page.getByTestId("animated-spinner");

  await expect(progress).toHaveText("progress 0.000");
  await expect(fill).toHaveCSS("width", "0px");

  await page.getByTestId("animated-half").click();
  await expect(progress).toHaveText("progress 0.500");
  // A 240 px track with a 1 px border leaves 238 px of content, so half of it,
  // and the `"0deg"` → `"360deg"` rotation is halfway round.
  await expect(fill).toHaveCSS("width", "119px");
  await expect(spinner).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
});

test("a timing animation runs to its end value", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-interaction--motion");
  await page.getByTestId("animated-run").click();
  await expect(page.getByTestId("animated-progress")).toHaveText(
    "progress 1.000",
    { timeout: 5_000 },
  );
  await expect(
    page.getByTestId("animated-track").locator("div").first(),
  ).toHaveCSS("width", "238px");
});

test("a pan responder claims a drag and reports its distance", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--gestures");
  const state = page.getByTestId("pan-state");
  await expect(state).toHaveText("idle 0,0");

  const box = (await page.getByTestId("pan-box").boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // A press alone does not claim the gesture: the threshold is 4 px.
  await expect(state).toHaveText("idle 0,0");

  // The move that crosses the threshold is the one that grants the responder,
  // and the grant resets the distance — so `dx` is measured from here, not
  // from the press.
  await page.mouse.move(x + 10, y);
  await expect(state).toHaveText("grant 0,0");

  await page.mouse.move(x + 70, y + 20);
  await expect(state).toHaveText("move 60,20");
  await page.mouse.up();
  await expect(state).toHaveText("release 60,20");
});

test("a responder view reports a position relative to itself", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=primitives-interaction--gestures");
  const spot = page.getByTestId("responder-spot");
  await expect(spot).toHaveText("none");

  const box = (await page.getByTestId("responder-box").boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 12);
  await page.mouse.down();
  // `locationX` / `locationY` are measured from the responder's own box, which
  // is what `TimelineRuler` and `Scrubber` seek with.
  await expect(spot).toHaveText("30,12");
  await page.mouse.up();
});
