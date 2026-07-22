import assert from "node:assert/strict";
import test from "node:test";

import {
  applyNativeTextChange,
  marksForNativeSelection,
} from "../../src/rich-text/nativeRichTextEditing";
import { serializeMarkdown } from "../../src/rich-text/markdownSerialize";
import type { InlineMark } from "../../src/rich-text/richTextModel";

const INLINE_CASES = [
  { content: "b", literal: "**b**", mark: "bold" },
  { content: "i", literal: "*i*", mark: "italic" },
  { content: "s", literal: "~~s~~", mark: "strike" },
  { content: "x", literal: "`x`", mark: "code" },
] as const;

test("native inline autoformat exits its mark before continued typing", () => {
  for (const { content, literal, mark } of INLINE_CASES) {
    const before = literal.slice(0, -1);
    const formatted = applyNativeTextChange({
      block: 0,
      document: [{ spans: [{ marks: [], text: before }], type: "paragraph" }],
      marks: [],
      nextText: literal,
      selection: { end: before.length, start: before.length },
    });
    const typingMarks =
      formatted.typingMarks ??
      marksForNativeSelection(
        formatted.document,
        formatted.target.block,
        formatted.target.selection,
      );
    const continued = applyNativeTextChange({
      block: formatted.target.block,
      document: formatted.document,
      marks: typingMarks,
      nextText: `${content} more`,
      selection: formatted.target.selection,
    });

    assert.deepEqual(formatted.typingMarks, [], `${mark} typing marks`);
    assert.equal(serializeMarkdown(continued.document), `${literal} more`);
  }
});

test("native inline autoformat retains explicitly active typing marks", () => {
  const formatted = applyNativeTextChange({
    block: 0,
    document: [
      { spans: [{ marks: ["italic"], text: "**b*" }], type: "paragraph" },
    ],
    marks: ["italic"],
    nextText: "**b**",
    selection: { end: 4, start: 4 },
  });

  assert.deepEqual(formatted.typingMarks, ["italic"] satisfies InlineMark[]);
});
