import assert from "node:assert/strict";
import test from "node:test";

import {
  matchInlineInputRule,
  matchPrefixInputRule,
} from "../../src/rich-text/inputRules";

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

test("matches inline autoformat closing delimiters at the caret", () => {
  const cases = [
    ["**bold*", "*", "bold", 2, 6, 0, 8, "**bold**"],
    ["*italic", "*", "italic", 1, 7, 0, 8, "*italic*"],
    ["`code", "`", "code", 1, 5, 0, 6, "`code`"],
    ["~~strike~", "~", "strike", 2, 8, 0, 10, "~~strike~~"],
  ] as const;

  for (const [
    textBeforeCaret,
    insertedText,
    mark,
    contentFrom,
    contentTo,
    triggerFrom,
    triggerTo,
    literal,
  ] of cases) {
    assert.deepEqual(matchInlineInputRule({ insertedText, textBeforeCaret }), {
      contentFrom,
      contentTo,
      literal,
      mark,
      triggerFrom,
      triggerTo,
    });
  }
});

test("inline autoformat ignores ambiguous italic and multiline matches", () => {
  assert.equal(
    matchInlineInputRule({ insertedText: "*", textBeforeCaret: "a**" }),
    null,
  );
  assert.equal(
    matchInlineInputRule({ insertedText: "*", textBeforeCaret: "*a\nb" }),
    null,
  );
  assert.equal(
    matchInlineInputRule({ insertedText: "x", textBeforeCaret: "`code`" }),
    null,
  );
});
