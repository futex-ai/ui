import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });
test.setTimeout(120_000);

const storyReadyTimeout = 110_000;

async function gotoRichTextStory(page: Page, storyId = "playground") {
  const id = `richtext-examples--${storyId}`;
  const url = `/iframe.html?id=${id}&viewMode=story`;
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

test("heading prefix converts the block and updates markdown", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  const editor = page.getByTestId("rich-text-editor");
  await editor.click();
  await page.keyboard.type("# Hello ");

  await expect(page.locator('[data-rt="h1"]')).toHaveText(/Hello/);
  await expect(page.getByTestId("rich-text-markdown-out")).toContainText(
    "# Hello",
  );
});

test("dash-space starts a bullet list", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("- Item");

  await expect(page.locator('[data-rt="ul"] [data-rt="li"]')).toHaveText(
    "Item",
  );
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("- Item");
});

test("Enter splits list items and Enter on an empty list item exits", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("- First");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await expect(page.locator('[data-rt="ul"] [data-rt="li"]')).toHaveCount(2);
  await expect(page.locator('[data-rt="p"]').last()).toBeVisible();
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "- First\n- Second",
  );
});

test("Backspace at the start of a paragraph merges it backward", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("Alpha");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Beta");
  await placeCaretAtBlockStart(page, 1);
  await page.keyboard.press("Backspace");

  await expect(page.locator('[data-rt="p"]')).toHaveCount(1);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "AlphaBeta",
  );
});

test("prefix-rule revert disarms after subsequent typing", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("# Hello");
  await placeCaretAtBlockStart(page, 0);
  await page.keyboard.press("Backspace");

  await expect(page.locator('[data-rt="h1"]')).toHaveText("Hello");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "# Hello",
  );
});

test("Enter deletes a same-block selection before splitting", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("hello world");
  await selectTextInBlock(page, 0, 6, 11);
  await page.keyboard.press("Enter");

  await expect(page.locator('[data-rt="p"]')).toHaveCount(2);
  await expect(page.getByTestId("rich-text-markdown-out")).not.toContainText(
    "world",
  );
});

test("Shift+Enter deletes a same-block selection before soft-breaking", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("hello world");
  await selectTextInBlock(page, 0, 6, 11);
  await page.keyboard.press("Shift+Enter");

  await expect(page.locator('[data-rt="p"]')).toHaveCount(1);
  const readout = page.getByTestId("rich-text-markdown-out");
  await expect(readout).toContainText("hello");
  await expect(readout).not.toContainText("world");
});

test("prefix-rule revert disarms when focus leaves the editor", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("# Hello");
  await page.getByTestId("rich-text-markdown-out").click();
  await placeCaretAtBlockStart(page, 0);
  await page.keyboard.press("Backspace");

  await expect(page.locator('[data-rt="h1"]')).toHaveText("Hello");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "# Hello",
  );
});

test("slash opens the menu at the caret", async ({ page }) => {
  await gotoRichTextStory(page);

  const editor = page.getByTestId("rich-text-editor");
  await editor.click();
  await page.keyboard.type("/");

  const menu = page.getByTestId("rich-text-slash-menu");
  await expect(menu).toBeVisible();
  const editorBox = await editor.boundingBox();
  const menuBox = await menu.boundingBox();
  expect(editorBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox?.x).toBeGreaterThanOrEqual(editorBox?.x ?? 0);
  expect(menuBox?.y).toBeGreaterThan(editorBox?.y ?? 0);
});

test("slash menu typing filters rows", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/code");

  const menu = page.getByTestId("rich-text-slash-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("Code block")).toBeVisible();
  await expect(menu.getByText("Heading 1")).toHaveCount(0);
});

test("slash menu arrow navigation and Enter convert the block", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  const editor = page.getByTestId("rich-text-editor");
  await editor.click();
  await page.mouse.move(0, 0);
  await page.keyboard.type("/h");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Title");

  await expect(page.locator('[data-rt="h2"]')).toHaveText("Title");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "## Title",
  );
});

test("slash menu Escape closes and leaves query text intact", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/quote");
  await expect(page.getByTestId("rich-text-slash-menu")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByTestId("rich-text-slash-menu")).toHaveCount(0);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("/quote");
});

test("slash menu shows a no-results state", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/xyz");

  const menu = page.getByTestId("rich-text-slash-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("No results")).toBeVisible();
});

test("clicking no-results keeps focus and continues the slash query", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  const editor = page.getByTestId("rich-text-editor");
  await editor.click();
  await page.keyboard.type("/xyz");

  const menu = page.getByTestId("rich-text-slash-menu");
  await menu.getByText("No results").click();

  await expect(menu).toBeVisible();
  await expect(editor).toBeFocused();
  await page.keyboard.type("q");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("/xyzq");
  await expect(menu.getByText("No results")).toBeVisible();
});

test("slash menu keeps wheel scrolling enabled", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/");

  const listbox = page.locator('[role="listbox"]');
  await expect(listbox).toBeVisible();
  await listbox.evaluate((element) => {
    element.scrollTop = 0;
  });
  await listbox.hover();
  await page.mouse.wheel(0, 240);
  await expect
    .poll(() => listbox.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});

test("Backspace past the slash closes the menu", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/");
  await expect(page.getByTestId("rich-text-slash-menu")).toBeVisible();
  await page.keyboard.press("Backspace");

  await expect(page.getByTestId("rich-text-slash-menu")).toHaveCount(0);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("");
});

test("extra slash item executes editor commands", async ({ page }) => {
  await gotoRichTextStory(page, "with-extra-slash-items");

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/insert");
  const row = page.getByTestId("rich-text-slash-item-extra:insert-paragraph");
  await expect(row.locator("svg")).toBeVisible();
  await row.click();

  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "Inserted from slash menu",
  );
});

test("primary Alt+2 toggles heading 2", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("Title");
  await page.keyboard.press(primaryShortcut("Alt+2"));

  await expect(page.locator('[data-rt="h2"]')).toHaveText("Title");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "## Title",
  );

  await page.keyboard.press(primaryShortcut("Alt+2"));
  await expect(page.locator('[data-rt="p"]')).toHaveText("Title");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("Title");
});

test("primary B toggles bold over a selected range", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("hello world");
  await selectTextInBlock(page, 0, 6, 11);
  await page.keyboard.press(primaryShortcut("b"));

  await expect(page.locator('[data-rt="p"] strong')).toHaveText("world");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "hello **world**",
  );

  await page.keyboard.press(primaryShortcut("b"));
  await expect(page.locator('[data-rt="p"] strong')).toHaveCount(0);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "hello world",
  );
});

test("bold autoformat applies and immediate Backspace restores literal text", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("**bold**");

  await expect(page.locator('[data-rt="p"] strong')).toHaveText("bold");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "**bold**",
  );

  await page.keyboard.press("Backspace");
  await expect(page.locator('[data-rt="p"] strong')).toHaveCount(0);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    String.raw`\*\*bold\*\*`,
  );
});

test("code autoformat wraps typed code spans", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("`code`");

  await expect(page.locator('[data-rt="p"] code')).toHaveText("code");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("`code`");
});

test("undo and redo restore a structural split", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("Alpha");
  await page.keyboard.press("Enter");

  await expect(page.locator('[data-rt="p"]')).toHaveCount(2);
  await page.keyboard.press(primaryShortcut("z"));

  await expect(page.locator('[data-rt="p"]')).toHaveCount(1);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("Alpha");

  await page.keyboard.press(primaryShortcut("Shift+z"));
  await expect(page.locator('[data-rt="p"]')).toHaveCount(2);
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("Alpha");
});

test("undo and redo restore a prefix-rule application", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("# ");

  await expect(page.locator('[data-rt="h1"]')).toBeVisible();
  await expectReadoutText(page, "# ");

  await page.keyboard.press(primaryShortcut("z"));
  await expect(page.locator('[data-rt="p"]')).toHaveText("# ");
  await expectReadoutText(page, String.raw`\# `);

  await page.keyboard.press(primaryShortcut("Shift+z"));
  await expect(page.locator('[data-rt="h1"]')).toBeVisible();
  await expectReadoutText(page, "# ");
});

test("typing burst undo is coalesced and redo restores the readout", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("abc");
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("abc");

  await page.keyboard.press(primaryShortcut("z"));
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("");

  await page.keyboard.press(primaryShortcut("Shift+z"));
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText("abc");
});

test("native cut records the pre-cut undo snapshot", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("abc def");
  await selectTextInBlock(page, 0, 4, 7);
  await page.keyboard.press(primaryShortcut("x"));

  await expect(page.getByTestId("rich-text-markdown-out")).not.toContainText(
    "def",
  );

  await page.keyboard.press(primaryShortcut("z"));
  await expectReadoutText(page, "abc def");
});

test("synthetic composition records history and clears stale redo", async ({
  page,
}) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("abc");
  await page.keyboard.press(primaryShortcut("z"));
  await expectReadoutText(page, "");

  await page.evaluate(() => {
    const editor = document.querySelector<HTMLElement>(
      '[data-testid="rich-text-editor"]',
    );
    const block = document.querySelector<HTMLElement>('[data-rt-index="0"]');
    if (!editor || !block) {
      throw new Error("Rich text editor block not found");
    }
    editor.focus();
    editor.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    block.textContent = "é";
    const text = block.firstChild;
    const range = document.createRange();
    if (text) {
      range.setStart(text, text.textContent?.length ?? 0);
    } else {
      range.setStart(block, block.childNodes.length);
    }
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "é" }),
    );
  });

  await expectReadoutText(page, "é");
  await page.keyboard.press(primaryShortcut("z"));
  await expectReadoutText(page, "");
  await page.keyboard.press(primaryShortcut("Shift+z"));
  await expectReadoutText(page, "é");
});

test("checklist checkbox click toggles markdown state", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("[] Task");

  const checkbox = page.locator('[data-rt="checkbox"]');
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "- [ ] Task",
  );
  await checkbox.click();
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "- [x] Task",
  );
  await checkbox.click();
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "- [ ] Task",
  );
});

test("pasting markdown inserts parsed blocks", async ({ page }) => {
  await gotoRichTextStory(page);

  const editor = page.getByTestId("rich-text-editor");
  await editor.click();
  await editor.evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text/plain", "# Pasted\n\n- Item\n\n- [x] Done");
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  });

  await expect(page.locator('[data-rt="h1"]')).toHaveText("Pasted");
  await expect(
    page.locator('[data-rt="ul"] [data-rt="li"]').first(),
  ).toHaveText("Item");
  await expect(page.locator('[data-rt="checkbox"]')).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("rich-text-markdown-out")).toHaveText(
    "# Pasted\n\n- Item\n\n- [x] Done",
  );
});

test("Playground story has no axe violations", async ({ page }) => {
  await gotoRichTextStory(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("Playground slash menu has no axe violations", async ({ page }) => {
  await gotoRichTextStory(page);

  await page.getByTestId("rich-text-editor").click();
  await page.keyboard.type("/");
  await expect(page.getByTestId("rich-text-slash-menu")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

function primaryShortcut(key: string) {
  return `${process.platform === "darwin" ? "Meta" : "Control"}+${key}`;
}

async function expectReadoutText(page: Page, text: string) {
  await expect
    .poll(() =>
      page
        .getByTestId("rich-text-markdown-out")
        .evaluate((element) => element.textContent ?? ""),
    )
    .toBe(text);
}

async function placeCaretAtBlockStart(page: Page, blockIndex: number) {
  await page.evaluate((index) => {
    const block = document.querySelector<HTMLElement>(
      `[data-rt-index="${index}"]`,
    );
    if (!block) {
      throw new Error(`Block ${index} not found`);
    }
    block.closest<HTMLElement>('[data-testid="rich-text-editor"]')?.focus();
    const range = document.createRange();
    const target = block.firstChild ?? block;
    if (target.nodeType === Node.TEXT_NODE) {
      range.setStart(target, 0);
    } else {
      range.setStart(block, 0);
    }
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, blockIndex);
}

async function selectTextInBlock(
  page: Page,
  blockIndex: number,
  from: number,
  to: number,
) {
  await page.evaluate(
    ({ blockIndex: index, from: start, to: end }) => {
      const block = document.querySelector<HTMLElement>(
        `[data-rt-index="${index}"]`,
      );
      if (!block) {
        throw new Error(`Block ${index} not found`);
      }
      const textPointAtOffset = (element: HTMLElement, offset: number) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let remaining = offset;
        let current = walker.nextNode();
        while (current) {
          const length = current.textContent?.length ?? 0;
          if (remaining <= length) {
            return { node: current, offset: remaining };
          }
          remaining -= length;
          current = walker.nextNode();
        }
        return { node: element, offset: element.childNodes.length };
      };
      block.closest<HTMLElement>('[data-testid="rich-text-editor"]')?.focus();
      const range = document.createRange();
      const startPoint = textPointAtOffset(block, start);
      const endPoint = textPointAtOffset(block, end);
      range.setStart(startPoint.node, startPoint.offset);
      range.setEnd(endPoint.node, endPoint.offset);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    },
    { blockIndex, from, to },
  );
}
