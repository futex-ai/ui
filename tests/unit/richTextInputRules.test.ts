import assert from "node:assert/strict";
import test from "node:test";

import { matchPrefixInputRule } from "../../src/rich-text/inputRules";

test("matches space-triggered heading, list, checklist, quote, and code rules", () => {
  const cases = [
    ["#", "heading1", "# "],
    ["##", "heading2", "## "],
    ["###", "heading3", "### "],
    ["-", "bullet", "- "],
    ["*", "bullet", "* "],
    ["1.", "numbered", "1. "],
    ["42.", "numbered", "42. "],
    ["[]", "check", "[] "],
    ["[ ]", "check", "[ ] "],
    [">", "quote", "> "],
    ["```", "codeBlock", "``` "],
  ] as const;

  for (const [trigger, value, literal] of cases) {
    assert.deepEqual(
      matchPrefixInputRule({
        insertedText: " ",
        textAfterCaret: "",
        textBeforeCaret: trigger,
      }),
      {
        deleteTriggerLength: trigger.length,
        literal,
        type: "turnInto",
        value,
      },
    );
  }
});

test("matches divider on the third dash without needing a space", () => {
  assert.deepEqual(
    matchPrefixInputRule({
      insertedText: "-",
      textAfterCaret: "",
      textBeforeCaret: "--",
    }),
    {
      deleteTriggerLength: 2,
      literal: "---",
      type: "divider",
    },
  );
});

test("does not match when text remains after the caret or the inserted text differs", () => {
  assert.equal(
    matchPrefixInputRule({
      insertedText: " ",
      textAfterCaret: "tail",
      textBeforeCaret: "#",
    }),
    null,
  );
  assert.equal(
    matchPrefixInputRule({
      insertedText: "x",
      textAfterCaret: "",
      textBeforeCaret: "#",
    }),
    null,
  );
  assert.equal(
    matchPrefixInputRule({
      insertedText: " ",
      textAfterCaret: "",
      textBeforeCaret: "1)",
    }),
    null,
  );
});
