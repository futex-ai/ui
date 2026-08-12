import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  darkSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
  type SharedUiColors,
} from "../../src/theme";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

// Files allowed to contain literal white, with the exact count, so any new
// occurrence anywhere in src/ fails loudly instead of silently breaking the
// dark themes. Stories are exempt (demo scaffolding).
const WHITE_LITERAL_ALLOWLIST: Record<string, number> = {
  "theme.tsx": 4, // the two light presets' surface + onSolid "#ffffff" pairs
  "skeleton/Skeleton.tsx": 3, // sheen gradient stops stay white by design
  "workflow/WorkflowNode.tsx": 2, // fixed category palette glyphs (see D6)
  "toast/toastStyles.ts": 1, // the light-scheme arm of the solid hover wash
  // The preview's letterbox is a fixed near-black standing in for the void
  // around a frame, so what sits on it — the composition guides, the format
  // badge, and the empty-state caption — must stay white in every scheme.
  "video-editor/videoEditorStyles.ts": 4,
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === "stories" ? [] : walk(full);
    }
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

test("no stray literal white in library source (dark-mode guard)", () => {
  const pattern = /"#fff(?:fff)?"|'#fff(?:fff)?'|rgba\(\s*255,\s*255,\s*255/gi;
  for (const file of walk(SRC)) {
    const relative = file.slice(SRC.length + 1);
    const count = (readFileSync(file, "utf8").match(pattern) ?? []).length;
    const allowed = WHITE_LITERAL_ALLOWLIST[relative] ?? 0;
    assert.equal(
      count,
      allowed,
      `${relative}: ${count} literal white value(s), expected ${allowed}. ` +
        `Use theme.colors.onSolid (or extend the allowlist with a rationale).`,
    );
  }
});

const DARK_THEMES = {
  dark: darkSharedUiTheme,
  junoDark: junoDarkSharedUiTheme,
} as const;

test("dark presets are dark-schemed and self-consistent", () => {
  for (const [name, theme] of Object.entries(DARK_THEMES)) {
    assert.equal(theme.scheme, "dark", name);
    // onSolid is the page ink-well: content punched out of a solid fill.
    assert.equal(theme.colors.onSolid, theme.colors.bg, name);
    // controlBorder stays the hand-synced translucent ink tint.
    const inkChannels = theme.colors.ink
      .replace("#", "")
      .match(/../g)!
      .map((pair) => parseInt(pair, 16))
      .join(", ");
    assert.equal(
      theme.colors.controlBorder,
      `rgba(${inkChannels}, 0.27)`,
      name,
    );
  }
  // junoDark extends the juno base: radii carry over.
  assert.deepEqual(junoDarkSharedUiTheme.radii, junoSharedUiTheme.radii);
  assert.equal(darkSharedUiTheme.focusRing, true);
});

test("dark presets hold every documented WCAG pair", () => {
  // (text, fill, floor) triples mirroring the token JSDoc contracts plus the
  // component pairings the light themes already guarantee. 1.4.3 AA = 4.5,
  // 1.4.11 non-text = 3.
  const pairs: [string, keyof SharedUiColors, keyof SharedUiColors, number][] =
    [
      ["primary text", "ink", "surface", 7],
      ["primary text on page", "ink", "bg", 7],
      ["secondary text", "ink2", "surface", 4.5],
      ["muted text", "muted", "surface", 4.5],
      ["muted on page", "muted", "bg", 4.5],
      ["muted on soft fill", "muted", "soft", 4.5],
      ["placeholder", "placeholder", "surface", 4.5],
      ["soft primary badge", "primaryDeep", "primarySoft", 4.5],
      ["soft warning badge", "amberDeep", "amberSoft", 4.5],
      ["soft danger badge", "roseDeep", "roseSoft", 4.5],
      ["solid primary", "onSolid", "primaryDeep", 4.5],
      ["solid warning", "onSolid", "amberDeep", 4.5],
      ["solid danger", "onSolid", "roseDeep", 4.5],
      ["solid neutral", "onSolid", "ink2", 4.5],
      ["solid button", "onSolid", "primary", 4.5],
      // Typography's `danger` token and the workflow edge palette's `neutral`
      // pair — both JSDoc'd as AA "in all four shipped themes".
      ["danger text", "rose", "surface", 4.5],
      ["neutral workflow edge", "ink2", "bg2", 4.5],
      ["accent vs surface", "primary", "surface", 3],
      ["switch on-knob vs track", "onSolid", "primary", 3],
      ["switch off-knob vs track", "ink", "border2", 3],
    ];
  for (const [themeName, theme] of Object.entries(DARK_THEMES)) {
    for (const [label, text, fill, floor] of pairs) {
      const ratio = contrastRatio(theme.colors[text], theme.colors[fill]);
      assert.ok(
        ratio >= floor,
        `${themeName} ${label}: ${theme.colors[text]} on ${theme.colors[fill]} ` +
          `= ${ratio.toFixed(2)}:1 (needs >= ${floor}:1)`,
      );
    }
  }
});

test("data-grid fixed dark pill pairs meet AA", () => {
  const pairs = [
    ["blue", "#a8c8ee", "#1c2a3a"],
    ["purple", "#c3b2f0", "#2a2440"],
    ["teal", "#7fd0c0", "#16302b"],
  ] as const;
  for (const [label, text, fill] of pairs) {
    const ratio = contrastRatio(text, fill);
    assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1`);
  }
});

// Copied verbatim from tests/unit/badge.test.ts so this guard stays free of the
// react-native import chain. Hex-only parsing is fine: every asserted token is
// a hex literal (`controlBorder` is deliberately absent — it is the documented
// sub-3:1 trade).
function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const channels = [0, 2, 4].map(
    (i) => parseInt(full.slice(i, i + 2), 16) / 255,
  );
  const [r, g, b] = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}
