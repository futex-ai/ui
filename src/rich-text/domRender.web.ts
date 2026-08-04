/** Imperative DOM renderer for RichTextEditor web documents. */
import type { SharedUiTheme } from "../theme";

import type {
  InlineSpan,
  RichTextBlock,
  RichTextDocument,
} from "./richTextModel";
import { normalizeDocument, spansText } from "./richTextModel";

/** Typography and color values used by the raw DOM renderer. */
export type RichTextDomRenderTheme = {
  body: TextDomStyle;
  code: TextDomStyle;
  h1: TextDomStyle;
  h2: TextDomStyle;
  h3: TextDomStyle;
  theme: SharedUiTheme;
};

type TextDomStyle = {
  color?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  lineHeight?: number | string;
};

const editorBoundarySpace = "\u00a0";
const editorCaretBoundary = "\u200b";

/** Re-render the full contentEditable document tree from the canonical model. */
export function renderRichTextDocument(
  root: HTMLElement,
  document: readonly RichTextBlock[],
  renderTheme: RichTextDomRenderTheme,
): RichTextDocument {
  const doc = normalizeDocument(document);
  root.textContent = "";
  let index = 0;
  while (index < doc.length) {
    const block = doc[index];
    if (
      block.type === "bullet" ||
      block.type === "numbered" ||
      block.type === "check"
    ) {
      const { nextIndex, wrapper } = renderListRun(doc, index, renderTheme);
      root.append(wrapper);
      index = nextIndex;
      continue;
    }
    root.append(renderBlock(block, index, renderTheme));
    index += 1;
  }
  return doc;
}

function renderListRun(
  doc: RichTextDocument,
  startIndex: number,
  renderTheme: RichTextDomRenderTheme,
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
    wrapper.append(renderListItem(doc[index], index, renderTheme));
    index += 1;
  }
  return { nextIndex: index, wrapper };
}

function renderBlock(
  block: RichTextBlock,
  index: number,
  renderTheme: RichTextDomRenderTheme,
): HTMLElement {
  switch (block.type) {
    case "paragraph":
      return textBlock(
        "p",
        "p",
        block.spans,
        index,
        renderTheme,
        renderTheme.body,
      );
    case "heading1":
      return textBlock(
        "h1",
        "h1",
        block.spans,
        index,
        renderTheme,
        renderTheme.h1,
      );
    case "heading2":
      return textBlock(
        "h2",
        "h2",
        block.spans,
        index,
        renderTheme,
        renderTheme.h2,
      );
    case "heading3":
      return textBlock(
        "h3",
        "h3",
        block.spans,
        index,
        renderTheme,
        renderTheme.h3,
      );
    case "quote":
      return quoteBlock(block.spans, index, renderTheme);
    case "codeBlock":
      return codeBlock(block.code, index, renderTheme);
    case "divider":
      return dividerBlock(index, renderTheme);
    case "bullet":
    case "numbered":
    case "check":
      return renderListItem(block, index, renderTheme);
  }
}

function renderListItem(
  block: RichTextBlock,
  index: number,
  renderTheme: RichTextDomRenderTheme,
): HTMLElement {
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
    renderInline(text, block.spans);
    ensureCaretTarget(text);
    item.append(checkbox, text);
    return item;
  }
  if ("spans" in block) {
    renderInline(item, block.spans);
    ensureCaretTarget(item);
  }
  return item;
}

function textBlock(
  tagName: "h1" | "h2" | "h3" | "p",
  rt: string,
  spans: readonly InlineSpan[],
  index: number,
  renderTheme: RichTextDomRenderTheme,
  style: TextDomStyle,
): HTMLElement {
  const element = document.createElement(tagName);
  element.dataset.rt = rt;
  element.dataset.rtIndex = String(index);
  element.style.margin = tagName === "p" ? "0 0 8px" : "0 0 10px";
  applyTextStyle(element, style);
  renderInline(element, spans);
  ensureCaretTarget(element);
  if (renderTheme.theme.radii.sm) {
    element.style.borderRadius = `${renderTheme.theme.radii.sm}px`;
  }
  return element;
}

function quoteBlock(
  spans: readonly InlineSpan[],
  index: number,
  renderTheme: RichTextDomRenderTheme,
): HTMLElement {
  const element = document.createElement("blockquote");
  element.dataset.rt = "quote";
  element.dataset.rtIndex = String(index);
  element.style.borderLeft = `3px solid ${renderTheme.theme.colors.border2}`;
  element.style.margin = "0 0 10px";
  element.style.padding = "2px 0 2px 12px";
  applyTextStyle(element, renderTheme.body);
  renderInline(element, spans);
  ensureCaretTarget(element);
  return element;
}

function codeBlock(
  code: string,
  index: number,
  renderTheme: RichTextDomRenderTheme,
): HTMLElement {
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
  codeElement.textContent = code;
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

function renderInline(parent: HTMLElement, spans: readonly InlineSpan[]): void {
  for (const span of spans) {
    appendMarkedText(parent, span, 0);
    if (span.marks.length > 0) {
      parent.appendChild(document.createTextNode(editorCaretBoundary));
    }
  }
}

function appendMarkedText(
  parent: Node,
  span: InlineSpan,
  markIndex: number,
): void {
  if (markIndex >= span.marks.length) {
    appendTextWithBreaks(parent, span.text);
    return;
  }
  const wrapper = document.createElement(markTag(span.marks[markIndex]));
  parent.appendChild(wrapper);
  appendMarkedText(wrapper, span, markIndex + 1);
}

function appendTextWithBreaks(parent: Node, text: string): void {
  const parts = text.split("\n");
  parts.forEach((part, index) => {
    if (index > 0) {
      parent.appendChild(document.createElement("br"));
    }
    if (part.length > 0) {
      parent.appendChild(document.createTextNode(renderEditableText(part)));
    }
  });
}

function renderEditableText(text: string): string {
  return text.replace(/^ +| +$/g, (spaces) =>
    editorBoundarySpace.repeat(spaces.length),
  );
}

function ensureCaretTarget(element: HTMLElement): void {
  if (element.textContent === "" && element.querySelector("br") === null) {
    element.append(document.createElement("br"));
  }
}

function markTag(
  mark: InlineSpan["marks"][number],
): "code" | "em" | "s" | "strong" {
  switch (mark) {
    case "bold":
      return "strong";
    case "italic":
      return "em";
    case "strike":
      return "s";
    case "code":
      return "code";
  }
}

function applyTextStyle(element: HTMLElement, style: TextDomStyle): void {
  if (style.color) {
    element.style.color = style.color;
  }
  if (style.fontFamily) {
    element.style.fontFamily = style.fontFamily;
  }
  if (style.fontSize !== undefined) {
    element.style.fontSize =
      typeof style.fontSize === "number"
        ? `${style.fontSize}px`
        : style.fontSize;
  }
  if (style.fontWeight !== undefined) {
    element.style.fontWeight = String(style.fontWeight);
  }
  if (style.lineHeight !== undefined) {
    element.style.lineHeight =
      typeof style.lineHeight === "number"
        ? `${style.lineHeight}px`
        : style.lineHeight;
  }
}

function applyListStyle(
  element: HTMLElement,
  renderTheme: RichTextDomRenderTheme,
): void {
  element.style.margin = "0 0 8px";
  // One shared text column for every list kind: bullet/number markers hang
  // inside a 24px pad, and checklist rows reach the same column with a 16px
  // box + 8px gap instead of a pad.
  if (element.dataset.rt === "checklist") {
    element.style.listStyleType = "none";
    element.style.paddingLeft = "0";
  } else {
    element.style.paddingLeft = "24px";
  }
  applyTextStyle(element, renderTheme.body);
}

function applyCheckboxStyle(
  element: HTMLElement,
  checked: boolean,
  renderTheme: RichTextDomRenderTheme,
): void {
  element.style.alignItems = "center";
  element.style.backgroundColor = checked
    ? renderTheme.theme.colors.primary
    : renderTheme.theme.colors.surface;
  element.style.border = `1px solid ${checked ? renderTheme.theme.colors.primaryDeep : renderTheme.theme.colors.controlBorder}`;
  element.style.borderRadius = `${renderTheme.theme.radii.sm}px`;
  element.style.boxSizing = "border-box";
  element.style.color = renderTheme.theme.colors.onSolid;
  element.style.display = "inline-flex";
  element.style.fontFamily = renderTheme.theme.fonts.sans;
  element.style.fontSize = "10px";
  element.style.fontWeight = "800";
  element.style.height = "16px";
  element.style.justifyContent = "center";
  element.style.flexShrink = "0";
  element.style.lineHeight = "14px";
  element.style.marginRight = "8px";
  // Center the 16px box on the first text line instead of eyeballing a
  // translate: (body line height − box height) / 2.
  const lineHeight =
    typeof renderTheme.body.lineHeight === "number"
      ? renderTheme.body.lineHeight
      : 22;
  element.style.marginTop = `${Math.max(0, Math.round((lineHeight - 16) / 2))}px`;
  element.style.width = "16px";
}
