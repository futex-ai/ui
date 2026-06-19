import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("typography owns a local type scale keyed by variant", () => {
  const stylesSource = readSource("../../src/typography/typographyStyles.ts");

  // The full role set: five headings plus body, label, caption, and overline.
  assert.match(
    stylesSource,
    /export type TypographyVariant =\s*\|\s*"h1"\s*\|\s*"h2"\s*\|\s*"h3"\s*\|\s*"h4"\s*\|\s*"h5"\s*\|\s*"body"\s*\|\s*"label"\s*\|\s*"caption"\s*\|\s*"overline"/,
  );
  // Scale rows: absolute px line-height, string font weights, px tracking.
  assert.match(
    stylesSource,
    /h1: \{\s*fontSize: 30,\s*fontWeight: "800",\s*lineHeight: 36,\s*letterSpacing: -0\.3,/,
  );
  assert.match(
    stylesSource,
    /body: \{\s*fontSize: 15,\s*fontWeight: "400",\s*lineHeight: 22,/,
  );
  // The label role is a heavier 14px step for control labels.
  assert.match(
    stylesSource,
    /label: \{\s*fontSize: 14,\s*fontWeight: "600",\s*lineHeight: 20,/,
  );
  // The overline is the uppercased eyebrow with widened tracking.
  assert.match(
    stylesSource,
    /overline: \{\s*fontSize: 11,\s*fontWeight: "700",\s*lineHeight: 16,\s*letterSpacing: 1,\s*color: "muted",\s*uppercase: true,/,
  );
  // The local scale lives in a Record like the spinner diameters.
  assert.match(stylesSource, /const TYPOGRAPHY_SCALE: Record</);
});

test("typography styles read shared theme font and resolve token colors", () => {
  const stylesSource = readSource("../../src/typography/typographyStyles.ts");

  assert.match(stylesSource, /fontFamily: theme\.fonts\.sans/);
  // Colors come from the variant's token resolved through the theme, not from
  // hard-coded color literals, so a theme swap recolors every variant.
  assert.match(
    stylesSource,
    /color: resolveTypographyColor\(theme\.colors, metrics\.color\)/,
  );
});

test("typography resolves semantic color tokens to AA-safe theme colors", () => {
  const stylesSource = readSource("../../src/typography/typographyStyles.ts");

  assert.match(stylesSource, /export type TypographyColor =/);
  // The token → theme color mapping (each holds ≥4.5:1 on the surface).
  assert.match(stylesSource, /case "default":\s*return colors\.ink;/);
  assert.match(stylesSource, /case "secondary":\s*return colors\.ink2;/);
  // `primary` steps down to the deep primary (the lighter primary is borderline).
  assert.match(stylesSource, /case "primary":\s*return colors\.primaryDeep;/);
  assert.match(stylesSource, /case "danger":\s*return colors\.rose;/);
  assert.match(stylesSource, /case "inverse":\s*return "#fff";/);
  // The decorative `faint` color (2.26:1, fails AA as text) is never exposed.
  assert.doesNotMatch(stylesSource, /"faint"/);
  assert.doesNotMatch(stylesSource, /colors\.faint/);
});

test("typography maps heading variants to aria levels 1-5 only", () => {
  const stylesSource = readSource("../../src/typography/typographyStyles.ts");

  assert.match(
    stylesSource,
    /HEADING_LEVELS: Partial<Record<TypographyVariant, 1 \| 2 \| 3 \| 4 \| 5>>/,
  );
  assert.match(stylesSource, /h1: 1,\s*h2: 2,\s*h3: 3,\s*h4: 4,\s*h5: 5,/);
  // The non-heading roles return undefined, so they stay plain text.
  assert.match(
    stylesSource,
    /export function typographyLevel\(\s*variant: TypographyVariant,\s*\): 1 \| 2 \| 3 \| 4 \| 5 \| undefined/,
  );
});

test("typography exposes heading semantics only for heading variants", () => {
  const source = readSource("../../src/typography/Typography.tsx");

  assert.match(source, /const level = typographyLevel\(variant\)/);
  // Heading variants get accessibilityRole="header" (RNW → role="heading");
  // the text roles get no role.
  assert.match(
    source,
    /accessibilityRole=\{level === undefined \? undefined : "header"\}/,
  );
  // aria-level is the web-only level; ignored on native, which has no level.
  assert.match(source, /aria-level=\{level\}/);
});

test("typography is one base Text with thin named wrappers", () => {
  const source = readSource("../../src/typography/Typography.tsx");

  // A single base component carries the rendering + theme + a11y logic.
  assert.match(source, /export function Text\(\{/);
  assert.match(source, /variant = "body"/);
  // Each wrapper just pins a variant onto the base Text — no forked logic.
  assert.match(source, /export function H1\(props: HeadingProps\) \{/);
  assert.match(source, /return <Text variant="h1" \{\.\.\.props\} \/>;/);
  assert.match(source, /export function H5\(props: HeadingProps\) \{/);
  assert.match(source, /return <Text variant="h5" \{\.\.\.props\} \/>;/);
  assert.match(source, /export function Body\(props: HeadingProps\) \{/);
  assert.match(source, /export function Label\(props: HeadingProps\) \{/);
  assert.match(source, /return <Text variant="label" \{\.\.\.props\} \/>;/);
  assert.match(source, /export function Caption\(props: HeadingProps\) \{/);
  assert.match(source, /export function Overline\(props: HeadingProps\) \{/);
  assert.match(source, /return <Text variant="overline" \{\.\.\.props\} \/>;/);
  // HeadingProps is TextProps without the variant the wrapper already pins.
  assert.match(source, /export type HeadingProps = Omit<TextProps, "variant">/);
});

test("typography forwards token-or-raw color overrides and truncation", () => {
  const source = readSource("../../src/typography/Typography.tsx");

  // The override accepts a semantic token or a raw color string.
  assert.match(source, /color\?: TypographyColor \| \(string & \{\}\)/);
  // A token resolves through the theme; any other string passes straight through.
  assert.match(source, /SEMANTIC_COLORS\.has\(color as TypographyColor\)/);
  assert.match(
    source,
    /resolveTypographyColor\(theme\.colors, color as TypographyColor\)/,
  );
  assert.match(source, /numberOfLines=\{numberOfLines\}/);
});

test("typography has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const typographySource = readSource("../../src/typography/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/typography"/);
  // The subpath barrel must actually re-export both modules — not merely mention
  // the word "Typography" somewhere — so a dropped export is caught.
  assert.match(typographySource, /export \* from "\.\/Typography"/);
  assert.match(typographySource, /export \* from "\.\/typographyStyles"/);
  assert.match(packageJson, /"\.\/typography"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
