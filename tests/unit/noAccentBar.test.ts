import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * The left accent bar — a colour-carrying strip down the left edge of a card,
 * toast, cell, or row — is banned house-wide (see the accent-bar rule in
 * `AGENTS.md`). It was removed from the library once already (the card toast's
 * 3px tone-coloured left border, #99) while the protocol doc that specified it
 * was left in place, so the spec kept inviting it back. This guard fails the
 * build the moment a left-edge border reappears in shipped source, mockups, or
 * Storybook chrome.
 *
 * Only the *left* edge is scanned. Right/top/bottom borders are how the
 * calendar and data grid draw their 1px column and row separators, which are
 * ordinary hairline rules rather than accent bars, so banning them outright
 * would be noise. A bar drawn as a narrow absolutely-positioned `View` is
 * likewise not mechanically detectable — the `AGENTS.md` rule covers that
 * shape; this test covers the border shape that regressed before.
 */
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Directories whose source ships visuals or specifies them. */
const SCANNED_DIRS = ["src", "docs/mockups", ".storybook"];

const SCANNED_EXTENSIONS = new Set([".css", ".html", ".ts", ".tsx"]);

/**
 * Left-edge border declarations in every dialect the repo writes: React Native
 * style objects (`borderLeftWidth`, the RTL-aware `borderStartColor`), inline
 * DOM styles (`element.style.borderLeft`), and CSS (`border-left`,
 * `border-inline-start`). Corner radii are geometry rather than an edge strip
 * and never spell `borderLeft`/`border-left` (they are `borderTopLeftRadius` /
 * `border-top-left-radius`), so they do not match.
 */
const LEFT_BORDER_PATTERN =
  /border(?:Left|Start|InlineStart)(?:Width|Color|Style)?\b|border-(?:left|start|inline-start)(?:-(?:width|color|style))?\b/;

/**
 * The sole sanctioned exception: the rich-text blockquote rule. A quote block's
 * left rule is markdown semantics — it is what a blockquote *is*, it matches the
 * approved mockup, and it is a neutral `border2` grey on an unfilled block
 * rather than tone decoration on a filled surface. Every other left border is a
 * regression.
 *
 * Keys are repo-relative paths, values the number of allowed occurrences in
 * that file, so silently loosening the guard (or dropping the blockquote) is
 * caught here too.
 */
const ALLOWED: ReadonlyMap<string, number> = new Map([
  // `borderLeftColor` + `borderLeftWidth` on the native quote block.
  ["src/rich-text/nativeRichTextStyles.ts", 2],
  // The web renderer's inline `borderLeft` shorthand on <blockquote>.
  ["src/rich-text/domRender.web.ts", 1],
  // The same rule in the rich-text-editor mockup, which is part of the spec.
  ["docs/mockups/rich-text-editor.html", 1],
]);

type Occurrence = { file: string; line: number; text: string };

test("no left accent bar in shipped source, mockups, or Storybook chrome", () => {
  const byFile = new Map<string, Occurrence[]>();
  for (const dir of SCANNED_DIRS) {
    for (const absolutePath of walk(join(REPO_ROOT, dir))) {
      const file = relative(REPO_ROOT, absolutePath).split("\\").join("/");
      const occurrences = leftBorderOccurrences(file, absolutePath);
      if (occurrences.length > 0) byFile.set(file, occurrences);
    }
  }

  const offenders = [...byFile]
    .filter(([file, occurrences]) => occurrences.length !== ALLOWED.get(file))
    .flatMap(([, occurrences]) => occurrences)
    .map((o) => `${o.file}:${o.line} — ${o.text}`);

  assert.deepEqual(
    offenders,
    [],
    `Left accent bars are banned (AGENTS.md). Carry tone with the icon colour, a tinted fill, a uniform border, an inset ring, a badge, or a dot instead:\n${offenders.join("\n")}`,
  );

  // The allowlist stays exhaustive in both directions: an entry for a file that
  // no longer has a left border is a stale exemption to delete.
  assert.deepEqual(
    [...ALLOWED.keys()].filter((file) => !byFile.has(file)),
    [],
    "Stale entry in the accent-bar allowlist — remove it.",
  );
});

function leftBorderOccurrences(file: string, absolutePath: string) {
  const occurrences: Occurrence[] = [];
  readFileSync(absolutePath, "utf8")
    .split("\n")
    .forEach((text, index) => {
      if (LEFT_BORDER_PATTERN.test(text)) {
        occurrences.push({ file, line: index + 1, text: text.trim() });
      }
    });
  return occurrences;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (SCANNED_EXTENSIONS.has(extname(entry.name))) {
      yield path;
    }
  }
}
