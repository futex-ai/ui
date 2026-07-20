/** Pure prefix input-rule matching for RichTextEditor block shortcuts. */
import type { RichTextTurnIntoType } from "./richTextModel";

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
