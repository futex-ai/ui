import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  defaultSharedUiTheme,
  junoSharedUiTheme,
  type SharedUiColors,
} from "../../src/theme";

test("badge exposes the four semantic tones and two fill variants", () => {
  const stylesSource = readSource("../../src/badge/badgeStyles.ts");

  assert.match(
    stylesSource,
    /export type BadgeTone =\s*\|?\s*"neutral"\s*\|\s*"primary"\s*\|\s*"warning"\s*\|\s*"danger"/,
  );
  assert.match(stylesSource, /export type BadgeVariant = "soft" \| "solid"/);
});

test("badge soft tones pair a tinted fill with the deep accent text", () => {
  const stylesSource = readSource("../../src/badge/badgeStyles.ts");

  // soft = tinted background + deep accent text (the green "Active" look).
  assert.match(
    stylesSource,
    /backgroundColor: colors\.primarySoft, color: colors\.primaryDeep/,
  );
  assert.match(
    stylesSource,
    /backgroundColor: colors\.amberSoft, color: colors\.amberDeep/,
  );
  assert.match(
    stylesSource,
    /backgroundColor: colors\.roseSoft, color: colors\.roseDeep/,
  );
  assert.match(
    stylesSource,
    /backgroundColor: colors\.bg2, color: colors\.ink2/,
  );
});

test("badge solid tones fill with the deep accent under white text", () => {
  const stylesSource = readSource("../../src/badge/badgeStyles.ts");

  for (const fill of ["ink2", "primaryDeep", "amberDeep", "roseDeep"]) {
    assert.match(
      stylesSource,
      new RegExp(`backgroundColor: colors\\.${fill}, color: "#fff"`),
    );
  }
});

test("badge sizes follow the shared control-size scale with md default", () => {
  const componentSource = readSource("../../src/badge/Badge.tsx");
  const stylesSource = readSource("../../src/badge/badgeStyles.ts");

  assert.match(componentSource, /size = "md"/);
  assert.match(componentSource, /tone = "neutral"/);
  assert.match(componentSource, /variant = "soft"/);
  assert.match(stylesSource, /const BADGE_SIZES: Record<\s*ControlSize,/);
  assert.match(stylesSource, /sm: \{\s*fontSize: 11/);
  assert.match(stylesSource, /md: \{\s*fontSize: 12/);
  assert.match(stylesSource, /lg: \{\s*fontSize: 13/);
  // The pill is fully rounded and hugs its content.
  assert.match(stylesSource, /borderRadius: theme\.radii\.pill/);
  assert.match(stylesSource, /alignSelf: "flex-start"/);
});

test("badge is a single-line label that reads from shared theme tokens", () => {
  const componentSource = readSource("../../src/badge/Badge.tsx");
  const stylesSource = readSource("../../src/badge/badgeStyles.ts");

  assert.match(componentSource, /numberOfLines=\{1\}/);
  // An explicit accessibilityLabel overrides the visible text as the name.
  assert.match(componentSource, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(stylesSource, /fontFamily: theme\.fonts\.sans/);
});

test("every badge tone/variant pair meets WCAG 1.4.3 AA on its fill", () => {
  // The (text token, fill token) pairs the resolver uses, mirrored here as raw
  // data so this guard stays free of the react-native import chain (the unit
  // runner cannot transform react-native). The source-grep test above pins that
  // badgeStyles.ts actually pairs these tokens, so together they prove the
  // rendered badge is AA. A token key resolves through the theme; "#fff" is the
  // literal solid-fill text color.
  type Token = keyof SharedUiColors | "#fff";
  const pairs: { label: string; text: Token; fill: Token }[] = [
    { label: "neutral/soft", text: "ink2", fill: "bg2" },
    { label: "primary/soft", text: "primaryDeep", fill: "primarySoft" },
    { label: "warning/soft", text: "amberDeep", fill: "amberSoft" },
    { label: "danger/soft", text: "roseDeep", fill: "roseSoft" },
    { label: "neutral/solid", text: "#fff", fill: "ink2" },
    { label: "primary/solid", text: "#fff", fill: "primaryDeep" },
    { label: "warning/solid", text: "#fff", fill: "amberDeep" },
    { label: "danger/solid", text: "#fff", fill: "roseDeep" },
  ];
  const themes = {
    default: defaultSharedUiTheme,
    juno: junoSharedUiTheme,
  };

  for (const [themeName, theme] of Object.entries(themes)) {
    const resolve = (token: Token) =>
      token === "#fff" ? "#fff" : theme.colors[token];
    for (const { label, text, fill } of pairs) {
      const textHex = resolve(text);
      const fillHex = resolve(fill);
      const ratio = contrastRatio(textHex, fillHex);
      assert.ok(
        ratio >= 4.5,
        `${themeName} ${label}: ${textHex} on ${fillHex} = ${ratio.toFixed(
          2,
        )}:1 (needs >= 4.5:1)`,
      );
    }
  }
});

test("badge has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const badgeSource = readSource("../../src/badge/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/badge"/);
  assert.match(badgeSource, /export \* from "\.\/Badge"/);
  assert.match(badgeSource, /export \* from "\.\/badgeStyles"/);
  assert.match(packageJson, /"\.\/badge"/);
});

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

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
