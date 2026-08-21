import { expect, test, type Page } from "@playwright/test";

test.setTimeout(120_000);

const storyReadyTimeout = 110_000;

async function gotoCollabStory(page: Page, storyId = "two-user-session") {
  const url = `/iframe.html?id=richtext-collaboration--${storyId}&viewMode=story`;
  let lastError: unknown = null;
  const deadline = Date.now() + storyReadyTimeout;
  while (Date.now() < deadline) {
    await page.goto(url);
    try {
      await page.waitForSelector('[data-testid="rich-text-editor"]', {
        timeout: 5_000,
      });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

test("tracked changes render as semantic ins/del over the document text", async ({
  page,
}) => {
  await gotoCollabStory(page);

  await expect(page.locator('del[data-rt-deco="delete"]')).toHaveText(
    "this Thursday",
  );
  await expect(page.locator('ins[data-rt-deco="insert"]')).toHaveText(
    "for everyone",
  );
  await expect(page.locator('del[data-rt-deco="delete"]')).toHaveAttribute(
    "title",
    "Deletion suggested by Robin Alvarez",
  );
});

test("comment threads highlight the words they are anchored to", async ({
  page,
}) => {
  await gotoCollabStory(page);

  await expect(page.locator('mark[data-rt-thread="t-workspaces"]')).toHaveText(
    "every workspace",
  );
  await expect(page.locator('mark[data-rt-thread="t-tracked"]')).toHaveText(
    "Tracked changes",
  );
});

test("a remote caret is drawn in the text with the collaborator's name", async ({
  page,
}) => {
  await gotoCollabStory(page);

  const caret = page.locator(
    '[data-rt-deco="caret"][data-rt-collaborator="robin"]',
  );
  await expect(caret).toHaveCount(1);
  await expect(caret.locator('[data-rt-deco="caret-flag"]')).toHaveText(
    "Robin Alvarez",
  );
  // The marker carries no document text, so the offset walker and the
  // serializer both step over it.
  await expect(caret).toHaveAttribute("contenteditable", "false");
  await expect(caret).toHaveAttribute("aria-hidden", "true");
});

test("the remote caret follows the collaborator to another block", async ({
  page,
}) => {
  await gotoCollabStory(page);

  const anchored = page.locator(
    '[data-rt-index="1"] [data-rt-deco="caret"][data-rt-collaborator="robin"]',
  );
  await expect(anchored).toHaveCount(1);

  await page.getByTestId("rich-text-move-peer").click();

  await expect(anchored).toHaveCount(0);
  await expect(
    page.locator(
      '[data-rt-index="3"] [data-rt-deco="caret"][data-rt-collaborator="robin"]',
    ),
  ).toHaveCount(1);
});

test("editing inside a tracked deletion does not turn it into a strike mark", async ({
  page,
}) => {
  await gotoCollabStory(page);

  const deletion = page.locator('del[data-rt-deco="delete"]');
  await deletion.click();
  await page.keyboard.type("!");

  const markdown = page.getByTestId("rich-text-collab-out");
  await expect(markdown).toContainText("this");
  // Decoration wrappers are transparent to the serializer: a <del> must not
  // come back as ~~strikethrough~~ markdown, and no wrapper may drop text.
  await expect(markdown).not.toContainText("~~");
  await expect(markdown).toContainText("every workspace");
  await expect(markdown).toContainText("Live carets for everyone");
});

test("selecting a rail card highlights its anchor in the document", async ({
  page,
}) => {
  await gotoCollabStory(page);

  const anchor = page.locator('mark[data-rt-thread="t-tracked"]');
  await expect(anchor).not.toHaveCSS("box-shadow", /inset/);

  await page.getByTestId("rich-text-rail-comment-t-tracked").click();

  await expect(anchor).toHaveCSS("box-shadow", /inset/);
});

test("clicking a comment anchor selects its thread", async ({ page }) => {
  await gotoCollabStory(page);

  const workspaces = page.locator('mark[data-rt-thread="t-workspaces"]');
  await page.locator('mark[data-rt-thread="t-tracked"]').click();

  await expect(workspaces).not.toHaveCSS("box-shadow", /inset/);
  await expect(page.locator('mark[data-rt-thread="t-tracked"]')).toHaveCSS(
    "box-shadow",
    /inset/,
  );
});

test("an anchor click still lands after the rail moved the selection", async ({
  page,
}) => {
  await gotoCollabStory(page);

  // The rail selects one thread, then the document selects a different one:
  // the editor must not treat the second as a repeat of what it last reported.
  await page.getByTestId("rich-text-rail-comment-t-tracked").click();
  await expect(page.locator('mark[data-rt-thread="t-tracked"]')).toHaveCSS(
    "box-shadow",
    /inset/,
  );

  await page.locator('mark[data-rt-thread="t-workspaces"]').click();

  await expect(page.locator('mark[data-rt-thread="t-workspaces"]')).toHaveCSS(
    "box-shadow",
    /inset/,
  );
  await expect(page.locator('mark[data-rt-thread="t-tracked"]')).not.toHaveCSS(
    "box-shadow",
    /inset/,
  );
});

test("accepting a change clears its decoration and its card", async ({
  page,
}) => {
  await gotoCollabStory(page);

  await expect(page.locator('del[data-rt-deco="delete"]')).toHaveCount(1);

  await page
    .getByTestId("rich-text-rail-suggestion-s-thursday")
    .getByRole("button", { name: "Accept" })
    .click();

  await expect(page.locator('del[data-rt-deco="delete"]')).toHaveCount(0);
  await expect(
    page.getByTestId("rich-text-rail-suggestion-s-thursday"),
  ).toHaveCount(0);
  // The words stay in the document; applying the edit is the caller's job.
  await expect(page.getByTestId("rich-text-editor")).toContainText(
    "this Thursday",
  );
});

test("a read-only review still draws every decoration", async ({ page }) => {
  await gotoCollabStory(page, "read-only-review");

  await expect(page.locator('del[data-rt-deco="delete"]')).toHaveCount(1);
  await expect(page.locator('ins[data-rt-deco="insert"]')).toHaveCount(1);
  await expect(page.locator('[data-rt-deco="caret"]')).toHaveCount(1);
});

test("an empty session renders the editor with no decorations", async ({
  page,
}) => {
  await gotoCollabStory(page, "nothing-to-review");

  await expect(page.locator("[data-rt-deco]")).toHaveCount(0);
  await expect(page.getByTestId("rich-text-rail")).toContainText(
    "No open comments or changes",
  );
});
