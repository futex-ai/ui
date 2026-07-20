/** Pure input-rule matching for RichTextEditor typing shortcuts. */
import type { InlineMark, RichTextTurnIntoType } from "./richTextModel";

/** Structural action produced by a prefix shortcut match. */
export type RichTextPrefixRule =
  | {
      deleteTriggerLength: number;
      literal: string;
      type: "turnInto";
      value: RichTextTurnIntoType;
    }
  | {
      deleteTriggerLength: number;
      literal: string;
      type: "divider";
    };

/** Values needed to test whether a `beforeinput` event should fire a rule. */
export type PrefixRuleInput = {
  insertedText: string;
  textAfterCaret: string;
  textBeforeCaret: string;
};

/** Inline mark action produced by an autoformat delimiter match. */
export type RichTextInlineRule = {
  contentFrom: number;
  contentTo: number;
  literal: string;
  mark: InlineMark;
  triggerFrom: number;
  triggerTo: number;
};

/** Values needed to test whether typed text should autoformat inline content. */
export type InlineRuleInput = {
  insertedText: string;
  textBeforeCaret: string;
};

/** Return the matching block prefix rule, or `null` when native input should proceed. */
export function matchPrefixInputRule({
  insertedText,
  textAfterCaret,
  textBeforeCaret,
}: PrefixRuleInput): RichTextPrefixRule | null {
  if (textAfterCaret.length > 0) {
    return null;
  }
  if (insertedText === "-" && textBeforeCaret === "--") {
    return {
      deleteTriggerLength: 2,
      literal: "---",
      type: "divider",
    };
  }
  if (insertedText !== " ") {
    return null;
  }
  switch (textBeforeCaret) {
    case "#":
      return turnInto("heading1", "# ");
    case "##":
      return turnInto("heading2", "## ");
    case "###":
      return turnInto("heading3", "### ");
    case "-":
    case "*":
      return turnInto("bullet", `${textBeforeCaret} `);
    case "[]":
    case "[ ]":
      return turnInto("check", `${textBeforeCaret} `);
    case ">":
      return turnInto("quote", "> ");
    case "```":
      return turnInto("codeBlock", "``` ");
    default:
      return /^\d+\.$/.test(textBeforeCaret)
        ? turnInto("numbered", `${textBeforeCaret} `)
        : null;
  }
}

/** Return the matching inline autoformat rule, or `null` for native input. */
export function matchInlineInputRule({
  insertedText,
  textBeforeCaret,
}: InlineRuleInput): RichTextInlineRule | null {
  const text = textBeforeCaret + insertedText;
  const candidates =
    insertedText === "*"
      ? [boldCandidate(text), italicCandidate(text)]
      : insertedText === "~"
        ? [delimitedCandidate(text, "~~", "strike")]
        : insertedText === "`"
          ? [delimitedCandidate(text, "`", "code")]
          : [];
  return candidates.find((candidate) => candidate !== null) ?? null;
}

function turnInto(
  value: RichTextTurnIntoType,
  literal: string,
): RichTextPrefixRule {
  return {
    deleteTriggerLength: literal.length - 1,
    literal,
    type: "turnInto",
    value,
  };
}

function boldCandidate(text: string): RichTextInlineRule | null {
  return delimitedCandidate(text, "**", "bold");
}

function italicCandidate(text: string): RichTextInlineRule | null {
  if (text.endsWith("**")) {
    return null;
  }
  return delimitedCandidate(text, "*", "italic");
}

function delimitedCandidate(
  text: string,
  delimiter: string,
  mark: InlineMark,
): RichTextInlineRule | null {
  if (!text.endsWith(delimiter)) {
    return null;
  }
  const closeFrom = text.length - delimiter.length;
  const openFrom =
    delimiter === "*"
      ? findSingleStarOpening(text, closeFrom)
      : findOpeningDelimiter(text, delimiter, closeFrom);
  if (openFrom < 0) {
    return null;
  }
  const contentFrom = openFrom + delimiter.length;
  const contentTo = closeFrom;
  if (
    contentFrom >= contentTo ||
    text.slice(contentFrom, contentTo).includes("\n")
  ) {
    return null;
  }
  return {
    contentFrom,
    contentTo,
    literal: text.slice(openFrom),
    mark,
    triggerFrom: openFrom,
    triggerTo: text.length,
  };
}

function findOpeningDelimiter(
  text: string,
  delimiter: string,
  before: number,
): number {
  for (let index = before - delimiter.length; index >= 0; index -= 1) {
    if (text.startsWith(delimiter, index) && !isEscaped(text, index)) {
      return index;
    }
  }
  return -1;
}

function findSingleStarOpening(text: string, before: number): number {
  for (let index = before - 1; index >= 0; index -= 1) {
    if (
      text[index] === "*" &&
      text[index - 1] !== "*" &&
      text[index + 1] !== "*" &&
      !isEscaped(text, index)
    ) {
      return index;
    }
  }
  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (
    let cursor = index - 1;
    cursor >= 0 && text[cursor] === "\\";
    cursor -= 1
  ) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}
