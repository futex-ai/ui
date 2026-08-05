import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("avatar renders solid and soft tones driven by shared theme tokens", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");
  const stylesSource = readSource("../../src/avatar/avatarStyles.ts");

  assert.match(source, /const solid = tone === "solid"/);
  assert.match(source, /solid \? styles\.avatarSolid : styles\.avatarSoft/);
  assert.match(source, /solid \? styles\.avatarTextSolid : null/);
  assert.match(
    stylesSource,
    /avatarSolid: \{ backgroundColor: theme\.colors\.primary \}/,
  );
  assert.match(
    stylesSource,
    /avatarSoft: \{ backgroundColor: theme\.colors\.soft \}/,
  );
  // Both tone foregrounds are resolved by `avatarForegroundColor`, so the
  // tokens are asserted there rather than inline on the style entries.
  assert.match(stylesSource, /theme\.colors\.primaryDeep/);
  assert.match(stylesSource, /theme\.colors\.onSolid/);
  assert.match(
    stylesSource,
    /avatarTextSolid: \{ color: avatarForegroundColor\(theme, true\) \}/,
  );
  assert.match(stylesSource, /fontFamily: theme\.fonts\.sans/);
});

test("avatar resolves one foreground color for the initials and the loader", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");
  const stylesSource = readSource("../../src/avatar/avatarStyles.ts");

  // The tone/override precedence lives in exactly one place so the dots can
  // never be drawn in a different color from the initials they replace.
  assert.match(
    stylesSource,
    /return override \?\? \(solid \? theme\.colors\.onSolid : theme\.colors\.primaryDeep\)/,
  );
  assert.match(
    stylesSource,
    /avatarText: \{[\s\S]*?avatarForegroundColor\(theme, false\)/,
  );
  assert.match(
    source,
    /color=\{avatarForegroundColor\(theme, solid, textColor\)\}/,
  );
});

test("avatar swaps the initials for the dot-grid loader while loading", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");

  assert.match(source, /loading = false/);
  assert.match(source, /loading\?: boolean/);
  // The grid replaces the initials rather than sitting over them, and reuses
  // the library's one dot-grid shape at its shared cycle length.
  assert.match(source, /\{loading \? \(/);
  assert.match(source, /<DotGridLoader/);
  assert.match(source, /duration=\{LOADER_DURATIONS\["dot-grid"\]\}/);
  assert.match(source, /size=\{avatarLoaderSize\(size\)\}/);
  // The disc keeps its own geometry, so the box does not shift when the load
  // finishes: no size/borderRadius branch on `loading`.
  assert.match(source, /\{ borderRadius, height: size, width: size \}/);
});

test("avatar reports a busy progressbar only while loading and exposed", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");

  assert.match(source, /const busy = loading && !decorative/);
  assert.match(
    source,
    /accessibilityRole=\{\s*busy \? "progressbar" : decorative \? undefined : "image"\s*\}/,
  );
  assert.match(
    source,
    /accessibilityState=\{busy \? \{ busy: true \} : undefined\}/,
  );
  assert.match(source, /aria-busy=\{busy \|\| undefined\}/);
  // The animated grid itself stays decorative — the container above owns the
  // role and the accessible name.
  assert.match(source, /<View aria-hidden>\s*<DotGridLoader/);
});

test("avatar sizes the disc and initials from the size prop", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");

  assert.match(source, /size = 32/);
  assert.match(source, /shape = "circle"/);
  // Whitespace-tolerant: the call sits right on Prettier's 80-column limit,
  // so it may be formatted on one line or wrapped across four.
  assert.match(
    source,
    /avatarBorderRadius\(\s*size,\s*shape,\s*theme\.radii\.avatarRatio,?\s*\)/,
  );
  assert.match(source, /height: size, width: size/);
  assert.match(source, /fontSize: size \* 0\.38/);
});

test("avatar exposes a public shape type and re-exports it", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");
  const radiusSource = readSource("../../src/avatar/avatarRadius.ts");
  const indexSource = readSource("../../src/avatar/index.ts");

  assert.match(radiusSource, /export type AvatarShape = "circle" \| "square"/);
  assert.match(source, /shape\?: AvatarShape/);
  assert.match(indexSource, /export \* from "\.\/avatarRadius"/);
});

test("avatar forwards accessible names and style overrides", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");

  assert.match(
    source,
    /accessibilityLabel=\{\s*decorative \? undefined : \(accessibilityLabel \?\? label\)\s*\}/,
  );
  assert.match(source, /style,\n/);
  assert.match(source, /textColor\?: TextStyle\["color"\]/);
  assert.match(
    source,
    /textColor === undefined \? null : \{ color: textColor \}/,
  );
});

test("avatar has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const avatarSource = readSource("../../src/avatar/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/avatar"/);
  assert.match(avatarSource, /Avatar/);
  assert.match(packageJson, /"\.\/avatar"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
