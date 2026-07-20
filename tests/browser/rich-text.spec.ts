import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const storyReadyTimeout = 30_000;

async function gotoRichTextStory(page: Page, storyId = "playground") {
  await page.goto(
    `/iframe.html?id=richtext-examples--${storyId}&viewMode=story`,
  );
  await page.waitForSelector('[data-testid="rich-text-editor"]', {
    timeout: storyReadyTimeout,
  });
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
