import assert from "node:assert/strict";
import test from "node:test";

import {
  richTextCollabPalette,
  richTextCollabStyle,
  richTextCollaboratorInitials,
  withAlpha,
} from "../../src/rich-text/richTextCollabPalette";
import {
  richTextCollabRailItems,
  richTextPresenceSummary,
  richTextPreviewLine,
  richTextSuggestionSummary,
} from "../../src/rich-text/richTextCollabRailModel";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";
import { darkSharedUiTheme, defaultSharedUiTheme } from "../../src/theme";

const theme = defaultSharedUiTheme;

const document: RichTextDocument = [
  { spans: [{ marks: [], text: "The quick brown fox" }], type: "paragraph" },
  { spans: [{ marks: [], text: "jumps over" }], type: "paragraph" },
];

const range = (
  fromBlock: number,
  fromOffset: number,
  toBlock: number,
  toOffset: number,
) => ({
  from: { block: fromBlock, offset: fromOffset },
  to: { block: toBlock, offset: toOffset },
});

test("a two-person session takes primary then rose, leaving amber to comments", () => {
  const palette = richTextCollabPalette(theme, [
    { id: "cal", name: "Cal Moore" },
    { id: "robin", name: "Robin Alvarez" },
  ]);

  assert.equal(palette.get("cal")?.tone, "primary");
  assert.equal(palette.get("robin")?.tone, "rose");
  assert.equal(palette.get("cal")?.accent, theme.colors.primary);
  assert.equal(palette.get("robin")?.deep, theme.colors.roseDeep);
});

test("a pinned tone is honoured and never handed to anyone else", () => {
  const palette = richTextCollabPalette(theme, [
    { id: "cal", name: "Cal Moore" },
    { id: "robin", name: "Robin Alvarez", tone: "primary" },
    { id: "sam", name: "Sam Okoye" },
  ]);

  assert.equal(palette.get("robin")?.tone, "primary");
  assert.deepEqual(
    [palette.get("cal")?.tone, palette.get("sam")?.tone],
    ["rose", "amber"],
  );
});

test("more collaborators than accent families wrap around deterministically", () => {
  const palette = richTextCollabPalette(
    theme,
    ["a", "b", "c", "d", "e"].map((id) => ({ id, name: `Person ${id}` })),
  );

  assert.deepEqual(
    ["a", "b", "c", "d", "e"].map((id) => palette.get(id)?.tone),
    ["primary", "rose", "amber", "primary", "rose"],
  );
});

test("colours track the theme rather than being pinned to hex values", () => {
  const light = richTextCollabPalette(theme, [{ id: "cal", name: "Cal" }]);
  const dark = richTextCollabPalette(darkSharedUiTheme, [
    { id: "cal", name: "Cal" },
  ]);

  assert.equal(light.get("cal")?.accent, theme.colors.primary);
  assert.equal(dark.get("cal")?.accent, darkSharedUiTheme.colors.primary);
  assert.notEqual(light.get("cal")?.accent, dark.get("cal")?.accent);
});

test("an author outside the roster gets neutral ink, not a borrowed accent", () => {
  const palette = richTextCollabPalette(theme, [{ id: "cal", name: "Cal" }]);
  const stranger = richTextCollabStyle(palette, theme, "nobody");

  assert.equal(stranger.accent, theme.colors.muted);
  assert.equal(stranger.name, "Unknown");
  assert.equal(richTextCollabStyle(palette, theme, undefined).initials, "?");
});

test("initials come from the first and last name parts", () => {
  assert.equal(richTextCollaboratorInitials("Robin Alvarez"), "RA");
  assert.equal(richTextCollaboratorInitials("Cal"), "C");
  assert.equal(richTextCollaboratorInitials("  ada  b  lovelace "), "AL");
  assert.equal(richTextCollaboratorInitials("   "), "?");
});

test("explicit initials override the derived ones", () => {
  const palette = richTextCollabPalette(theme, [
    { id: "cal", initials: "🌱", name: "Cal Moore" },
  ]);

  assert.equal(palette.get("cal")?.initials, "🌱");
});

test("alpha blending handles both hex forms and falls back otherwise", () => {
  assert.equal(withAlpha("#4f7864", 0.2, "#fff"), "rgba(79, 120, 100, 0.2)");
  assert.equal(withAlpha("#abc", 1, "#fff"), "rgba(170, 187, 204, 1)");
  // A translucent token cannot be reduced without a colour parser.
  assert.equal(withAlpha("rgba(28, 31, 29, 0.27)", 0.2, "#eef2ed"), "#eef2ed");
});

test("rail entries are ordered by their place in the document", () => {
  const items = richTextCollabRailItems({
    commentThreads: [{ comments: [], id: "t1", range: range(1, 0, 1, 5) }],
    document,
    suggestions: [
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 4, 0, 9) },
    ],
  });

  assert.deepEqual(
    items.map((item) => [item.kind, item.id]),
    [
      ["suggestion", "s1"],
      ["comment", "t1"],
    ],
  );
});

test("entries sharing an anchor break the tie on kind then id", () => {
  const items = richTextCollabRailItems({
    commentThreads: [
      { comments: [], id: "t2", range: range(0, 0, 0, 5) },
      { comments: [], id: "t1", range: range(0, 0, 0, 5) },
    ],
    document,
    suggestions: [
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 0, 0, 5) },
    ],
  });

  assert.deepEqual(
    items.map((item) => item.id),
    ["s1", "t1", "t2"],
  );
});

test("previews are read out of the document unless the caller overrides", () => {
  const items = richTextCollabRailItems({
    commentThreads: [{ comments: [], id: "t1", range: range(0, 10, 0, 15) }],
    document,
    suggestions: [
      {
        authorId: "a",
        id: "s1",
        kind: "delete",
        preview: "text that has already gone",
        range: range(0, 4, 0, 9),
      },
    ],
  });

  assert.equal(items[0].preview, "text that has already gone");
  assert.equal(items[1].preview, "brown");
});

test("previews are empty when no document is supplied", () => {
  const items = richTextCollabRailItems({
    commentThreads: [{ comments: [], id: "t1", range: range(0, 10, 0, 15) }],
  });

  assert.equal(items[0].preview, "");
});

test("resolved and reviewed entries leave the rail unless asked for", () => {
  const input = {
    commentThreads: [
      { comments: [], id: "t1", range: range(0, 0, 0, 5), resolved: true },
    ],
    document,
    suggestions: [
      {
        authorId: "a",
        id: "s1",
        kind: "insert" as const,
        range: range(0, 0, 0, 5),
        status: "rejected" as const,
      },
    ],
  };

  assert.deepEqual(richTextCollabRailItems(input), []);
  assert.deepEqual(
    richTextCollabRailItems({ ...input, includeResolved: true }).map(
      (item) => item.id,
    ),
    ["s1", "t1"],
  );
});

test("a change is summarised in words, not by its styling alone", () => {
  assert.equal(
    richTextSuggestionSummary(
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 0, 0, 1) },
      "Robin",
    ),
    "Robin suggested adding text",
  );
  assert.equal(
    richTextSuggestionSummary(
      { authorId: "a", id: "s1", kind: "delete", range: range(0, 0, 0, 1) },
      "You",
    ),
    "You suggested deleting text",
  );
});

test("presence reads as a sentence for any number of collaborators", () => {
  assert.equal(richTextPresenceSummary([]), "Only you are editing");
  assert.equal(richTextPresenceSummary(["Robin"]), "Robin is editing");
  assert.equal(
    richTextPresenceSummary(["Cal", "Robin"]),
    "Cal and Robin are editing",
  );
  assert.equal(
    richTextPresenceSummary(["Cal", "Robin", "Sam"]),
    "Cal, Robin, and Sam are editing",
  );
});

test("previews collapse whitespace and truncate to one line", () => {
  assert.equal(richTextPreviewLine("  a\n  b \t c  "), "a b c");
  assert.equal(richTextPreviewLine("abcdef", 4), "abc…");
  assert.equal(richTextPreviewLine("abcd", 4), "abcd");
});
