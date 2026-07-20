/** Markdown serialization for the RichTextEditor document subset. */
import {
  InlineMark,
  InlineSpan,
  RichTextBlock,
  RichTextDocument,
  normalizeDocument,
  spansText,
} from "./richTextModel";

const MARK_DELIMITERS: Record<InlineMark, [string, string]> = {
  bold: ["**", "**"],
  code: ["`", "`"],
  italic: ["*", "*"],
  strike: ["~~", "~~"],
};

const ORDERED_MARKS: readonly InlineMark[] = [
  "bold",
  "italic",
  "strike",
  "code",
];

/** Serialize a rich-text document to the editor's canonical markdown subset. */
export function serializeMarkdown(document: readonly RichTextBlock[]): string {
  const blocks = trimTrailingPlaceholder(normalizeDocument(document));
  const parts: string[] = [];
  let numbered = 1;
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (index > 0) {
      parts.push(
        listKind(blocks[index - 1]) === listKind(block) && listKind(block)
          ? "\n"
          : "\n\n",
      );
    }
    if (block.type === "numbered") {
      parts.push(`${numbered}. ${serializeSpans(block.spans)}`);
      numbered += 1;
    } else {
      parts.push(serializeBlock(block));
      numbered = 1;
    }
  }
  return parts.join("");
}

/** Serialize inline spans without a containing block prefix. */
export function serializeSpans(spans: readonly InlineSpan[]): string {
  let atLineStart = true;
  const output: string[] = [];
  for (const span of spans) {
    const chunks = span.text.split("\n");
    chunks.forEach((chunk, index) => {
      if (index > 0) {
        output.push("\\\n");
        atLineStart = true;
      }
      if (chunk.length === 0) {
        return;
      }
      output.push(serializeMarkedText(chunk, span.marks, atLineStart));
      atLineStart = false;
    });
  }
  return output.join("");
}

function serializeBlock(block: RichTextBlock): string {
  switch (block.type) {
    case "paragraph":
      return serializeSpans(block.spans);
    case "heading1":
      return `# ${serializeSpans(block.spans)}`;
    case "heading2":
      return `## ${serializeSpans(block.spans)}`;
    case "heading3":
      return `### ${serializeSpans(block.spans)}`;
    case "bullet":
      return `- ${serializeSpans(block.spans)}`;
    case "check":
      return `- [${block.checked ? "x" : " "}] ${serializeSpans(block.spans)}`;
    case "quote":
      return serializeQuote(block.spans);
    case "codeBlock":
      return serializeCodeBlock(block.code);
    case "divider":
      return "---";
    case "numbered":
      return `1. ${serializeSpans(block.spans)}`;
  }
}

function serializeQuote(spans: readonly InlineSpan[]): string {
  const body = serializeSpans(spans);
  if (body.length === 0) {
    return "> ";
  }
  return body
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function serializeCodeBlock(code: string): string {
  const fence = "`".repeat(Math.max(3, longestBacktickRun(code) + 1));
  return `${fence}\n${code}\n${fence}`;
}

function serializeMarkedText(
  text: string,
  marks: readonly InlineMark[],
  atLineStart: boolean,
): string {
  const canonical = ORDERED_MARKS.filter((mark) => marks.includes(mark));
  const escaped = canonical.includes("code")
    ? text
    : escapePlainText(text, atLineStart);
  return canonical.reduceRight((inner, mark) => {
    if (mark === "code") {
      return serializeCodeSpan(inner);
    }
    const [open, close] = MARK_DELIMITERS[mark];
    return `${open}${inner}${close}`;
  }, escaped);
}

function serializeCodeSpan(text: string): string {
  const delimiter = "`".repeat(longestBacktickRun(text) + 1);
  const needsPadding =
    text.startsWith("`") ||
    text.endsWith("`") ||
    text.startsWith(" ") ||
    text.endsWith(" ");
  const body = needsPadding ? ` ${text} ` : text;
  return `${delimiter}${body}${delimiter}`;
}

function escapePlainText(text: string, atLineStart: boolean): string {
  const escaped = text.replace(/[\\*_~[\]`]/g, "\\$&");
  if (!atLineStart) {
    return escaped;
  }
  return escaped.replace(/^(\s*)(#{1,6}|>|[-+]|\d+[.)])/, "$1\\$2");
}

function longestBacktickRun(text: string): number {
  let longest = 0;
  let current = 0;
  for (const char of text) {
    if (char === "`") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function listKind(
  block: RichTextBlock,
): "bullet" | "check" | "numbered" | null {
  return block.type === "bullet" ||
    block.type === "check" ||
    block.type === "numbered"
    ? block.type
    : null;
}

function trimTrailingPlaceholder(document: RichTextDocument): RichTextDocument {
  const previous = document[document.length - 2];
  const last = document[document.length - 1];
  if (
    document.length > 1 &&
    previous?.type === "divider" &&
    last?.type === "paragraph" &&
    spansText(last.spans).length === 0
  ) {
    return document.slice(0, -1);
  }
  return document;
}
