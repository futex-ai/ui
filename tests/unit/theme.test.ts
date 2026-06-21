import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createSharedUiTheme,
  defaultSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

test("theme overrides preserve defaults for unspecified tokens", () => {
  const theme = createSharedUiTheme({
    colors: {
      primary: "#123456",
      primaryDeep: "#102030",
      primarySoft: "#eef4ff",
      primaryBorder: "#cad9ea",
    },
  });

  assert.equal(theme.colors.primary, "#123456");
  assert.equal(theme.colors.primaryDeep, "#102030");
  assert.equal(theme.colors.surface, defaultSharedUiTheme.colors.surface);
  assert.equal(theme.radii.md, defaultSharedUiTheme.radii.md);
});

test("juno theme maps the purple primary family", () => {
  assert.equal(junoSharedUiTheme.colors.primary, "#6F5BD0");
  assert.equal(junoSharedUiTheme.colors.primaryDeep, "#5A47BD");
  assert.equal(junoSharedUiTheme.colors.primarySoft, "#F0EBFA");
});

test("both themes define the deep amber/rose accents for badge tones", () => {
  // The deep accents back the warning/danger badge tones; the lighter
  // amber/rose accents fall below AA on their own soft tints, so these mirror
  // the existing primaryDeep precedent.
  assert.equal(defaultSharedUiTheme.colors.amberDeep, "#75531a");
  assert.equal(defaultSharedUiTheme.colors.roseDeep, "#8f3a30");
  assert.equal(junoSharedUiTheme.colors.amberDeep, "#80561c");
  assert.equal(junoSharedUiTheme.colors.roseDeep, "#9a4138");
});

test("focus ring uses the active shared theme primary color", () => {
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /theme\.colors\.primary/);
  assert.match(source, /focusRingStyle/);
});
