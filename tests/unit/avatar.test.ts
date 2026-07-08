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
  assert.match(stylesSource, /color: theme\.colors\.primaryDeep/);
  assert.match(stylesSource, /avatarTextSolid: \{ color: "#fff" \}/);
  assert.match(stylesSource, /fontFamily: theme\.fonts\.sans/);
});

test("avatar sizes the disc and initials from the size prop", () => {
  const source = readSource("../../src/avatar/Avatar.tsx");

  assert.match(source, /size = 32/);
  assert.match(source, /borderRadius: size \/ 2/);
  assert.match(source, /height: size, width: size/);
  assert.match(source, /fontSize: size \* 0\.38/);
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
