/** Markdown parser for the RichTextEditor document subset. */
import {
  InlineMark,
  InlineSpan,
  RichTextBlock,
  RichTextDocument,
  normalizeDocument,
} from "./richTextModel";

/** Parse tolerant markdown into the editor's canonical document model. */
export function parseMarkdown(markdown: string): RichTextDocument {
  if (markdown.length === 0) {
    return normalizeDocument([]);
  }
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichTextBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    const fence = openingFence(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !isClosingFence(lines[index], fence)) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ code: code.join("\n"), type: "codeBlock" });
      continue;
    }
    if (/^(---|\*\*\*|___)\s*$/.test(line.trim())) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (heading) {
      blocks.push({
        spans: parseInline(heading[2]),
        type: `heading${heading[1].length}` as
          | "heading1"
          | "heading2"
          | "heading3",
      });
      index += 1;
      continue;
    }
    const check = /^- \[( |x|X)\](?: |$)(.*)$/.exec(line);
    if (check) {
      blocks.push({
        checked: check[1].toLowerCase() === "x",
        spans: parseInline(check[2]),
        type: "check",
      });
      index += 1;
      continue;
    }
    const bullet = /^[-*+] (.*)$/.exec(line);
    if (bullet) {
      blocks.push({ spans: parseInline(bullet[1]), type: "bullet" });
      index += 1;
      continue;
    }
    const numbered = /^\d+[.)] (.*)$/.exec(line);
    if (numbered) {
      blocks.push({ spans: parseInline(numbered[1]), type: "numbered" });
      index += 1;
      continue;
    }
    const quote = /^> ?(.*)$/.exec(line);
    if (quote) {
      const quoteLines = [quote[1]];
      index += 1;
      while (index < lines.length) {
        const next = /^> ?(.*)$/.exec(lines[index]);
        if (!next) {
          break;
        }
        quoteLines.push(next[1]);
        index += 1;
      }
      blocks.push({
        spans: parseInline(joinHardBreakLines(quoteLines)),
        type: "quote",
      });
      continue;
    }
    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !startsRecognizedBlock(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({
      spans: parseInline(joinHardBreakLines(paragraphLines)),
      type: "paragraph",
    });
  }
  return normalizeDocument(blocks);
}

/** Parse inline markdown into normalized spans. */
export function parseInline(markdown: string): InlineSpan[] {
  const block = normalizeDocument([
    { spans: parseInlineWithMarks(markdown, []), type: "paragraph" },
  ])[0];
  return block.type === "paragraph" ? block.spans : [];
}

function parseInlineWithMarks(
  markdown: string,
  marks: readonly InlineMark[],
): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let buffer = "";
  let index = 0;
  const flush = () => {
    if (buffer.length > 0) {
      spans.push({ marks: [...marks], text: buffer });
      buffer = "";
    }
  };
  while (index < markdown.length) {
    const char = markdown[index];
    if (char === "\\" && index + 1 < markdown.length) {
      const next = markdown[index + 1];
      if (next === "\n") {
        buffer += "\n";
      } else {
        buffer += next;
      }
      index += 2;
      continue;
    }
    if (char === "`") {
      const ticks = countRun(markdown, index, "`");
      const close = findDelimiter(markdown, "`".repeat(ticks), index + ticks);
      if (close >= 0) {
        flush();
        spans.push({
          marks: addMark(marks, "code"),
          text: parseCodeSpanText(markdown.slice(index + ticks, close)),
        });
        index = close + ticks;
        continue;
      }
    }
    if (markdown.startsWith("**", index)) {
      const close = findDelimiter(markdown, "**", index + 2);
      if (close >= 0) {
        flush();
        spans.push(
          ...parseInlineWithMarks(
            markdown.slice(index + 2, close),
            addMark(marks, "bold"),
          ),
        );
        index = close + 2;
        continue;
      }
      buffer += "**";
      index += 2;
      continue;
    }
    if (markdown.startsWith("*", index)) {
      const close = findDelimiter(markdown, "*", index + 1);
      if (close >= 0) {
        flush();
        spans.push(
          ...parseInlineWithMarks(
            markdown.slice(index + 1, close),
            addMark(marks, "italic"),
          ),
        );
        index = close + 1;
        continue;
      }
    }
    if (markdown.startsWith("~~", index)) {
      const close = findDelimiter(markdown, "~~", index + 2);
      if (close >= 0) {
        flush();
        spans.push(
          ...parseInlineWithMarks(
            markdown.slice(index + 2, close),
            addMark(marks, "strike"),
          ),
        );
        index = close + 2;
        continue;
      }
      buffer += "~~";
      index += 2;
      continue;
    }
    buffer += char;
    index += 1;
  }
  flush();
  return spans;
}

function openingFence(line: string): string | null {
  const match = /^(`{3,})\s*$/.exec(line.trim());
  return match ? match[1] : null;
}

function isClosingFence(line: string, fence: string): boolean {
  return line.trim() === fence;
}

function startsRecognizedBlock(line: string): boolean {
  return Boolean(
    openingFence(line) ||
    /^(---|\*\*\*|___)\s*$/.test(line.trim()) ||
    /^(#{1,3}) /.test(line) ||
    /^- \[( |x|X)\](?: |$)/.test(line) ||
    /^[-*+] /.test(line) ||
    /^\d+[.)] /.test(line) ||
    /^> ?/.test(line),
  );
}

function joinHardBreakLines(lines: readonly string[]): string {
  const joined: string[] = [];
  for (const line of lines) {
    if (joined.length === 0) {
      joined.push(stripHardBreak(line));
      continue;
    }
    joined[joined.length - 1] += hardBreaksPrevious(lines, joined.length - 1)
      ? `\n${stripHardBreak(line)}`
      : `\n${stripHardBreak(line)}`;
  }
  return joined.join("");
}

function stripHardBreak(line: string): string {
  return line.endsWith("\\") ? line.slice(0, -1) : line;
}

function hardBreaksPrevious(lines: readonly string[], index: number): boolean {
  return lines[index]?.endsWith("\\") ?? false;
}

function findDelimiter(
  markdown: string,
  delimiter: string,
  from: number,
): number {
  let index = from;
  while (index < markdown.length) {
    if (markdown[index] === "\\") {
      index += 2;
      continue;
    }
    if (markdown.startsWith(delimiter, index)) {
      return index;
    }
    index += 1;
  }
  return -1;
}

function parseCodeSpanText(text: string): string {
  if (
    text.length >= 2 &&
    text.startsWith(" ") &&
    text.endsWith(" ") &&
    (isCodePaddingBoundary(text[1]) ||
      isCodePaddingBoundary(text[text.length - 2]))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function isCodePaddingBoundary(char: string | undefined): boolean {
  return char === "`" || char === " ";
}

function countRun(markdown: string, index: number, char: string): number {
  let cursor = index;
  while (markdown[cursor] === char) {
    cursor += 1;
  }
  return cursor - index;
}

function addMark(marks: readonly InlineMark[], mark: InlineMark): InlineMark[] {
  return marks.includes(mark) ? [...marks] : [...marks, mark];
}
