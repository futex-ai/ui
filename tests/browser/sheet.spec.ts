import { expect, test } from "@playwright/test";

/**
 * The web `Sheet`: its accessible name, its visible dismiss label, and the
 * `SheetTextInput` body, through the `Sheet/Examples` text-input story.
 */
const TEXT_INPUT_STORY =
  "/iframe.html?id=sheet-examples--text-input&viewMode=story";

test("the sheet is named by its label, and its dismiss label is visible text", async ({
  page,
}) => {
  await page.goto(TEXT_INPUT_STORY);
  const trigger = page.getByRole("button", { name: "Rename tag" });
  await trigger.click();

  // The visible title differs from the label; the label names the dialog.
  const sheet = page.getByRole("dialog", { name: "Rename tag" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Tag name" })).toBeVisible();

  // The dismiss label is the visible text and the name of the close button.
  const done = sheet.getByRole("button", { name: "Done" });
  await expect(done).toHaveText("Done");
  await expect(sheet.getByRole("button", { name: /^Close/ })).toHaveCount(0);

  // The sheet text input is the first control, so it takes focus on open.
  const input = sheet.getByRole("textbox", { name: "Tag name" });
  await expect(input).toBeFocused();
  await input.fill("Flat 3, 14 Brook Street");
  await done.click();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByText("Flat 3, 14 Brook Street")).toBeVisible();
});

test("a sheet without a dismiss label keeps the close icon named after its title", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=sheet-examples--bottom-sheet&viewMode=story",
  );
  await page.getByRole("button", { name: "Open sheet" }).click();
  const sheet = page.getByRole("dialog", { name: "Line settings" });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("button", { name: "Close Line settings" }),
  ).toBeVisible();
});
