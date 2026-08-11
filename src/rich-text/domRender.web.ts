/** Imperative DOM renderer for RichTextEditor web documents. */
import type {
  RichTextAnnotationInput,
  RichTextBlockAnnotations,
} from "./richTextCollabModel";
import {
  annotateRichTextDocument,
  hasRichTextAnnotations,
} from "./richTextCollabModel";
import type { RichTextCollabPalette } from "./richTextCollabPalette";
import type { RichTextInlineDecoration } from "./domInline.web";
import {
  ensureCaretTarget,
  renderInlineCode,
  renderInlineSpans,
} from "./domInline.web";
import type { RichTextDomRenderTheme } from "./domStyle.web";
import {
  applyCheckboxStyle,
  applyListStyle,
  applyTextStyle,
} from "./domStyle.web";
import type {
  InlineSpan,
  RichTextBlock,
  RichTextDocument,
} from "./richTextModel";
import { normalizeDocument, spansText } from "./richTextModel";

/** The collaboration overlay drawn over the document, if any. */
export type RichTextDomCollab = {
  palette: RichTextCollabPalette;
  state: RichTextAnnotationInput;
};

type BlockContext = {
  annotations: RichTextBlockAnnotations | null;
  collab: RichTextDomCollab | null;
  renderTheme: RichTextDomRenderTheme;
};

/** Re-render the full contentEditable document tree from the canonical model. */
export function renderRichTextDocument(
  root: HTMLElement,
  document: readonly RichTextBlock[],
  renderTheme: RichTextDomRenderTheme,
  collab: RichTextDomCollab | null = null,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const overlay =
    collab && hasRichTextAnnotations(collab.state)
      ? annotateRichTextDocument(doc, collab.state)
      : null;
  root.textContent = "";
  let index = 0;
  while (index < doc.length) {
    const block = doc[index];
    const context: BlockContext = {
      annotations: overlay?.[index] ?? null,
      collab,
      renderTheme,
    };
    if (
      block.type === "bullet" ||
      block.type === "numbered" ||
      block.type === "check"
    ) {
      const run = renderListRun(doc, index, renderTheme, overlay, collab);
      root.append(run.wrapper);
      index = run.nextIndex;
      continue;
    }
    root.append(renderBlock(block, index, context));
    index += 1;
  }
  return doc;
}

function renderListRun(
  doc: RichTextDocument,
  startIndex: number,
  renderTheme: RichTextDomRenderTheme,
  overlay: readonly RichTextBlockAnnotations[] | null,
  collab: RichTextDomCollab | null,
): { nextIndex: number; wrapper: HTMLElement } {
  const first = doc[startIndex];
  const wrapper = document.createElement(
    first.type === "numbered" ? "ol" : "ul",
  );
  wrapper.dataset.rt =
    first.type === "check"
      ? "checklist"
      : first.type === "numbered"
        ? "ol"
        : "ul";
  applyListStyle(wrapper, renderTheme);
  let index = startIndex;
  while (index < doc.length && doc[index].type === first.type) {
    wrapper.append(
      renderListItem(doc[index], index, {
        annotations: overlay?.[index] ?? null,
        collab,
        renderTheme,
      }),
    );
    index += 1;
  }
  return { nextIndex: index, wrapper };
}

function renderBlock(
  block: RichTextBlock,
  index: number,
  context: BlockContext,
): HTMLElement {
  const { renderTheme } = context;
  switch (block.type) {
    case "paragraph":
      return textBlock("p", "p", block.spans, index, context, renderTheme.body);
    case "heading1":
      return textBlock("h1", "h1", block.spans, index, context, renderTheme.h1);
    case "heading2":
      return textBlock("h2", "h2", block.spans, index, context, renderTheme.h2);
    case "heading3":
      return textBlock("h3", "h3", block.spans, index, context, renderTheme.h3);
    case "quote":
      return quoteBlock(block.spans, index, context);
    case "codeBlock":
      return codeBlock(block.code, index, context);
    case "divider":
      return dividerBlock(index, renderTheme);
    case "bullet":
    case "numbered":
    case "check":
      return renderListItem(block, index, context);
  }
}

function renderListItem(
  block: RichTextBlock,
  index: number,
  context: BlockContext,
): HTMLElement {
  const { renderTheme } = context;
  const item = document.createElement("li");
  item.dataset.rt = "li";
  item.dataset.rtIndex = String(index);
  applyTextStyle(item, renderTheme.body);
  item.style.margin = "4px 0";
  if (block.type === "check") {
    item.style.listStyleType = "none";
    item.style.paddingLeft = "0";
    // Flex keeps the box centered on the first text line and gives wrapped
    // lines a hanging indent at the shared list text column.
    item.style.alignItems = "flex-start";
    item.style.display = "flex";
    const checkbox = document.createElement("span");
    checkbox.contentEditable = "false";
    checkbox.dataset.rt = "checkbox";
    // Toggle fields need a non-empty accessible name (WCAG 4.1.2); the item
    // text names which entry the checkbox controls.
    checkbox.setAttribute(
      "aria-label",
      spansText(block.spans).trim() || "Checklist item",
    );
    checkbox.setAttribute("aria-checked", String(block.checked));
    checkbox.setAttribute("role", "checkbox");
    checkbox.setAttribute("tabindex", "-1");
    checkbox.textContent = block.checked ? "x" : "";
    applyCheckboxStyle(checkbox, block.checked, renderTheme);
    const text = document.createElement("span");
    text.dataset.rt = "checktext";
    text.style.flex = "1";
    text.style.minWidth = "0";
    renderInlineSpans(text, block.spans, decorationFor(context));
    ensureCaretTarget(text);
    item.append(checkbox, text);
    return item;
  }
  if ("spans" in block) {
    renderInlineSpans(item, block.spans, decorationFor(context));
    ensureCaretTarget(item);
  }
  return item;
}

function textBlock(
  tagName: "h1" | "h2" | "h3" | "p",
  rt: string,
  spans: readonly InlineSpan[],
  index: number,
  context: BlockContext,
  style: RichTextDomRenderTheme["body"],
): HTMLElement {
  const element = document.createElement(tagName);
  element.dataset.rt = rt;
  element.dataset.rtIndex = String(index);
  element.style.margin = tagName === "p" ? "0 0 8px" : "0 0 10px";
  applyTextStyle(element, style);
  renderInlineSpans(element, spans, decorationFor(context));
  ensureCaretTarget(element);
  if (context.renderTheme.theme.radii.sm) {
    element.style.borderRadius = `${context.renderTheme.theme.radii.sm}px`;
  }
  return element;
}

function quoteBlock(
  spans: readonly InlineSpan[],
  index: number,
  context: BlockContext,
): HTMLElement {
  const element = document.createElement("blockquote");
  element.dataset.rt = "quote";
  element.dataset.rtIndex = String(index);
  element.style.borderLeft = `3px solid ${context.renderTheme.theme.colors.border2}`;
  element.style.margin = "0 0 10px";
  element.style.padding = "2px 0 2px 12px";
  applyTextStyle(element, context.renderTheme.body);
  renderInlineSpans(element, spans, decorationFor(context));
  ensureCaretTarget(element);
  return element;
}

function codeBlock(
  code: string,
  index: number,
  context: BlockContext,
): HTMLElement {
  const { renderTheme } = context;
  const pre = document.createElement("pre");
  const codeElement = document.createElement("code");
  pre.dataset.rt = "code";
  pre.dataset.rtIndex = String(index);
  pre.style.backgroundColor = renderTheme.theme.colors.soft;
  pre.style.border = `1px solid ${renderTheme.theme.colors.border}`;
  pre.style.borderRadius = `${renderTheme.theme.radii.md}px`;
  pre.style.margin = "0 0 10px";
  pre.style.overflowX = "auto";
  pre.style.padding = "10px 12px";
  applyTextStyle(pre, renderTheme.code);
  renderInlineCode(codeElement, code, decorationFor(context));
  pre.append(codeElement);
  return pre;
}

function dividerBlock(
  index: number,
  renderTheme: RichTextDomRenderTheme,
): HTMLElement {
  const element = document.createElement("div");
  const rule = document.createElement("hr");
  element.contentEditable = "false";
  element.dataset.rt = "divider";
  element.dataset.rtIndex = String(index);
  element.style.margin = "12px 0";
  rule.style.border = "0";
  rule.style.borderTop = `1px solid ${renderTheme.theme.colors.border2}`;
  rule.style.margin = "0";
  element.append(rule);
  return element;
}

function decorationFor(context: BlockContext): RichTextInlineDecoration | null {
  if (!context.annotations || !context.collab) return null;
  return {
    annotations: context.annotations,
    palette: context.collab.palette,
    theme: context.renderTheme.theme,
  };
}
