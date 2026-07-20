/** Tolerant DOM-to-document serializer for RichTextEditor web documents. */
import {
  InlineMark,
  InlineSpan,
  RichTextBlock,
  RichTextDocument,
  normalizeDocument,
} from "./richTextModel";

/** Serialize arbitrary children of the contentEditable root into rich-text blocks. */
export function serializeRichTextDom(root: HTMLElement): RichTextDocument {
  const blocks: RichTextBlock[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) {
        blocks.push({ spans: [{ marks: [], text }], type: "paragraph" });
      }
      return;
    }
    if (!(node instanceof HTMLElement)) {
      return;
    }
    blocks.push(...serializeElementBlock(node));
  });
  return normalizeDocument(blocks);
}

function serializeElementBlock(element: HTMLElement): RichTextBlock[] {
  switch (element.dataset.rt) {
    case "p":
      return [{ spans: inlineSpans(element), type: "paragraph" }];
    case "h1":
      return [{ spans: inlineSpans(element), type: "heading1" }];
    case "h2":
      return [{ spans: inlineSpans(element), type: "heading2" }];
    case "h3":
      return [{ spans: inlineSpans(element), type: "heading3" }];
    case "quote":
      return [{ spans: inlineSpans(element), type: "quote" }];
    case "code":
      return [{ code: element.textContent ?? "", type: "codeBlock" }];
    case "divider":
      return [{ type: "divider" }];
    case "ul":
      return serializeList(element, "bullet");
    case "ol":
      return serializeList(element, "numbered");
    case "checklist":
      return serializeList(element, "check");
    default:
      return serializeNativeElement(element);
  }
}

function serializeNativeElement(element: HTMLElement): RichTextBlock[] {
  const tag = element.tagName.toLowerCase();
  if (tag === "ul") {
    return serializeList(element, "bullet");
  }
  if (tag === "ol") {
    return serializeList(element, "numbered");
  }
  if (tag === "h1" || tag === "h2" || tag === "h3") {
    return [
      {
        spans: inlineSpans(element),
        type: `heading${tag[1]}` as "heading1" | "heading2" | "heading3",
      },
    ];
  }
  if (tag === "blockquote") {
    return [{ spans: inlineSpans(element), type: "quote" }];
  }
  if (tag === "pre") {
    return [{ code: element.textContent ?? "", type: "codeBlock" }];
  }
  if (tag === "hr") {
    return [{ type: "divider" }];
  }
  return [{ spans: inlineSpans(element), type: "paragraph" }];
}

function serializeList(
  element: HTMLElement,
  kind: "bullet" | "check" | "numbered",
): RichTextBlock[] {
  const items = [...element.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.tagName.toLowerCase() === "li",
  );
  return items.map((item) => {
    if (kind === "check") {
      const checkbox = item.querySelector<HTMLElement>('[data-rt="checkbox"]');
      const text = item.querySelector<HTMLElement>('[data-rt="checktext"]');
      return {
        checked: checkbox?.getAttribute("aria-checked") === "true",
        spans: inlineSpans(text ?? item),
        type: "check",
      };
    }
    return { spans: inlineSpans(item), type: kind };
  });
}

function inlineSpans(node: Node): InlineSpan[] {
  if (isOnlyFillerBreak(node)) {
    return [];
  }
  const spans: InlineSpan[] = [];
  collectInline(node, [], spans);
  return spans;
}

function collectInline(
  node: Node,
  marks: readonly InlineMark[],
  spans: InlineSpan[],
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    appendSpan(spans, marks, node.textContent ?? "");
    return;
  }
  if (!(node instanceof HTMLElement)) {
    return;
  }
  if (node.contentEditable === "false") {
    return;
  }
  if (node.tagName.toLowerCase() === "br") {
    appendSpan(spans, marks, "\n");
    return;
  }
  const nextMarks = marksForElement(node, marks);
  node.childNodes.forEach((child) => collectInline(child, nextMarks, spans));
}

function marksForElement(
  element: HTMLElement,
  marks: readonly InlineMark[],
): readonly InlineMark[] {
  const tag = element.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") {
    return addMark(marks, "bold");
  }
  if (tag === "em" || tag === "i") {
    return addMark(marks, "italic");
  }
  if (tag === "s" || tag === "strike" || tag === "del") {
    return addMark(marks, "strike");
  }
  if (tag === "code") {
    return addMark(marks, "code");
  }
  return marks;
}

function appendSpan(
  spans: InlineSpan[],
  marks: readonly InlineMark[],
  text: string,
): void {
  if (text.length === 0) {
    return;
  }
  spans.push({ marks: [...marks], text });
}

function addMark(
  marks: readonly InlineMark[],
  mark: InlineMark,
): readonly InlineMark[] {
  return marks.includes(mark) ? marks : [...marks, mark];
}

function isOnlyFillerBreak(node: Node): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  const meaningful = [...node.childNodes].filter((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      return (child.textContent ?? "").length > 0;
    }
    return child instanceof HTMLElement && child.tagName.toLowerCase() !== "br";
  });
  return meaningful.length === 0 && node.querySelector("br") !== null;
}
