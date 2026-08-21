import { expect, test } from "@playwright/test";

/**
 * The assembled editor.
 *
 * The individual panels are covered by unit tests and by the timeline spec;
 * what only a browser can show is that they compose — that one piece of host
 * state drives the monitor, the transport, the timeline, the inspector, and the
 * export dialog together, which is the whole claim the `Full editor` story
 * makes.
 */

const EDITOR =
  "/iframe.html?id=video-editor-examples--full-editor-light&viewMode=story";

test("the editor renders every panel over one project", async ({ page }) => {
  await page.goto(EDITOR);

  await expect(page.getByTestId("editor-preview")).toBeVisible();
  await expect(page.getByTestId("editor-transport")).toBeVisible();
  await expect(page.getByTestId("editor-bin")).toBeVisible();
  await expect(page.getByTestId("editor-inspector")).toBeVisible();
  await expect(page.getByTestId("editor-effects")).toBeVisible();
  await expect(page.getByTestId("editor-keyframes")).toBeVisible();
  await expect(page.getByTestId("editor-timeline")).toBeVisible();
});

test("selecting a clip retitles the inspector", async ({ page }) => {
  await page.goto(EDITOR);
  const inspector = page.getByTestId("editor-inspector");
  await expect(inspector).toContainText("Interview A");

  await page.getByTestId("timeline-clip-shot-harbour").click();

  await expect(inspector).toContainText("Harbour wide");
});

test("selecting an audio clip swaps the inspector's sections", async ({
  page,
}) => {
  await page.goto(EDITOR);
  await page.getByTestId("timeline-clip-vo-intro").click();

  // A sound clip has levels, not a transform.
  await expect(page.getByTestId("editor-inspector")).toContainText("Audio");
  await expect(page.getByTestId("inspector-row-gain")).toBeVisible();
  await expect(page.getByTestId("inspector-row-scale")).toHaveCount(0);
});

test("the transport and the timeline share one playhead", async ({ page }) => {
  await page.goto(EDITOR);
  const scrubber = page.getByTestId("editor-transport-scrubber");
  const ruler = page.getByTestId("editor-timeline-ruler");

  const before = await ruler.getAttribute("aria-valuenow");
  await scrubber.focus();
  await page.keyboard.press("ArrowRight");

  // Seeking on the transport moves the timeline's own published position.
  expect(Number(await ruler.getAttribute("aria-valuenow"))).toEqual(
    Number(before) + 1,
  );
});

test("editing a property updates its field", async ({ page }) => {
  await page.goto(EDITOR);
  const scale = page.getByTestId("inspector-scale").getByRole("textbox");
  await expect(scale).toHaveValue("100");

  await scale.fill("140");
  await scale.press("Enter");

  await expect(scale).toHaveValue("140");
  // A changed value offers a reset, which restores the default.
  await page.getByTestId("inspector-row-scale-reset").click();
  await expect(scale).toHaveValue("100");
});

test("an effect can be disabled and removed", async ({ page }) => {
  await page.goto(EDITOR);
  await expect(page.getByTestId("effect-remove-effect-vignette")).toBeVisible();

  await page.getByTestId("effect-remove-effect-vignette").click();

  await expect(page.getByTestId("effect-remove-effect-vignette")).toHaveCount(
    0,
  );
  await expect(page.getByTestId("effect-remove-effect-balance")).toBeVisible();
});

test("a keyframe moves with the keyboard", async ({ page }) => {
  await page.goto(EDITOR);
  const keyframe = page.getByTestId("keyframe-op-1");
  const before = await keyframe.boundingBox();

  await keyframe.focus();
  for (let press = 0; press < 5; press += 1) {
    await page.keyboard.press("Shift+ArrowRight");
  }

  const after = await page.getByTestId("keyframe-op-1").boundingBox();
  expect(after?.x ?? 0).toBeGreaterThan(before?.x ?? 0);
});

test("the export dialog opens, estimates, and runs", async ({ page }) => {
  await page.goto(EDITOR);
  await page.getByTestId("editor-export-open").click();

  const dialog = page.getByTestId("export-dialog");
  await expect(dialog).toBeVisible();
  // The subtitle carries the estimate for the current settings.
  await expect(dialog).toContainText("1080p");
  await expect(dialog).toContainText("MP4");

  await page.getByTestId("export-dialog-start").click();
  await expect(page.getByTestId("export-dialog-progress")).toBeVisible();
});

test("the compact layout folds the side panes into tabs", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=video-editor-examples--full-editor-compact&viewMode=story",
  );

  await expect(page.getByTestId("editor-compact")).toBeVisible();
  // The timeline is the opening pane; the bin is behind a tab.
  await expect(page.getByTestId("editor-timeline")).toBeVisible();
  await expect(page.getByTestId("editor-bin")).toHaveCount(0);

  await page.getByRole("radio", { name: "Media" }).click();

  await expect(page.getByTestId("editor-bin")).toBeVisible();
  await expect(page.getByTestId("editor-timeline")).toHaveCount(0);
});
