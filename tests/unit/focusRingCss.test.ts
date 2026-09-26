import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  FOCUS_RING_COLOR_VARIABLE,
  FOCUS_RING_WIDTH_VARIABLE,
  focusRingColorFor,
  focusRingCssVariablesFor,
} from "../../src/focusRingCss";
import { domBackendCss } from "../../src/primitives/dom/css";
import { View } from "../../src/primitives/dom/View";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

test("DOM backend CSS paints focus-visible hosts and inset variants", () => {
  assert.match(domBackendCss, /\[data-firna-focus-ring="self"\]:focus-visible/);
  assert.match(
    domBackendCss,
    /\[data-firna-focus-ring="descendant"\]:has\(\[data-firna-focus-target\]:focus-visible\)/,
  );
  assert.match(
    domBackendCss,
    /\[data-firna-focus-ring="descendant"\]\[data-firna-focus-ring-inset\]:has\(\[data-firna-focus-target\]:focus-visible\)/,
  );
  assert.match(
    domBackendCss,
    /:focus-visible>\[data-firna-focus-ring="parent"\]/,
  );
  assert.match(
    domBackendCss,
    /box-shadow:0 0 0 var\(--firna-focus-ring-width,4px\) var\(--firna-focus-ring-color,rgba\(79, 120, 100, 0\.35\)\),var\(--firna-focus-ring-base-shadow/,
  );
  assert.match(
    domBackendCss,
    /box-shadow:inset 0 0 0 var\(--firna-focus-ring-width,4px\) var\(--firna-focus-ring-color,rgba\(79, 120, 100, 0\.35\)\),var\(--firna-focus-ring-base-shadow/,
  );
});

test("descendant hosts react only to their marked focus target", () => {
  // A clear, suffix, or chip-remove button nested inside a field must keep its
  // own browser outline rather than lighting the whole frame, so neither the
  // paint rule nor the outline reset may match an unmarked focused descendant.
  assert.doesNotMatch(domBackendCss, /:has\(:focus-visible\)/);
  assert.doesNotMatch(
    domBackendCss,
    /\[data-firna-focus-host="descendant"\] :focus-visible/,
  );
  assert.match(
    domBackendCss,
    /\[data-firna-focus-host="descendant"\]:has\(\[data-firna-focus-target\]:focus-visible\)\{outline:auto;\}/,
  );
  assert.match(
    domBackendCss,
    /\[data-firna-focus-host="descendant"\] \[data-firna-focus-target\]:focus-visible\{outline:none;\}/,
  );
});

test("DOM backend CSS restores a visible indicator in forced colors", () => {
  assert.match(domBackendCss, /@media \(forced-colors:active\)/);
  assert.match(domBackendCss, /outline:2px solid Highlight/);
  assert.match(domBackendCss, /box-shadow:none/);
  assert.doesNotMatch(domBackendCss, /(?:animation|transition)[-:]/);
});

test("focus hosts preserve an existing inline shadow behind the CSS ring", () => {
  const markup = renderToStaticMarkup(
    createElement(View, {
      dataSet: { firnaFocusRing: "self" },
      style: { boxShadow: "0 1px 2px rgb(1, 2, 3)" },
    }),
  );

  assert.match(
    markup,
    /--firna-focus-ring-base-shadow:0 1px 2px rgb\(1, 2, 3\)/,
  );
  assert.doesNotMatch(markup, /(?:^|;)box-shadow:/);
});

test("all presets resolve the CSS focus variables from their primary color", () => {
  const themes = {
    dark: darkSharedUiTheme,
    default: defaultSharedUiTheme,
    juno: junoSharedUiTheme,
    junoDark: junoDarkSharedUiTheme,
  };

  for (const [name, theme] of Object.entries(themes)) {
    const variables = focusRingCssVariablesFor(theme.colors.primary);
    assert.equal(
      variables[FOCUS_RING_COLOR_VARIABLE],
      focusRingColorFor(theme.colors.primary, 0.35),
      name,
    );
    assert.equal(variables[FOCUS_RING_WIDTH_VARIABLE], "4px", name);
  }
});

test("the four preset CSS glow values retain the primary color channels", () => {
  for (const theme of [
    defaultSharedUiTheme,
    junoSharedUiTheme,
    darkSharedUiTheme,
    junoDarkSharedUiTheme,
  ]) {
    const value = focusRingCssVariablesFor(theme.colors.primary)[
      FOCUS_RING_COLOR_VARIABLE
    ];
    assert.equal(value, focusRingColorFor(theme.colors.primary, 0.35));
    assert.match(value, /^rgba\(\d+, \d+, \d+, 0\.35\)$/);
  }
});
