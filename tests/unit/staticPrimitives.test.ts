import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { domBackendCss } from "../../src/primitives/dom/css";
import { loadBuiltPrimitives, testBuilt } from "./builtUi";

test(
  "the built primitives entry exposes its public API and renders DOM markup on web",
  { skip: !testBuilt },
  async () => {
    const primitives = await loadBuiltPrimitives();
    assert.deepEqual(Object.keys(primitives).sort(), [
      "AccessibilityInfo",
      "Animated",
      "Circle",
      "Defs",
      "Easing",
      "FlatList",
      "G",
      "Image",
      "InputAccessoryView",
      "Keyboard",
      "KeyboardAvoidingView",
      "Line",
      "LinearGradient",
      "Link",
      "Modal",
      "PanResponder",
      "Path",
      "Pattern",
      "Platform",
      "Polygon",
      "Pressable",
      "Rect",
      "ScrollView",
      "Stop",
      "StyleSheet",
      "Svg",
      "Text",
      "TextInput",
      "View",
      "domBackendCss",
      "useWindowDimensions",
    ]);
    assert.equal(primitives.Platform.OS, "web");
    assert.equal(primitives.domBackendCss, domBackendCss);

    const { Link, Path, Pressable, Svg, Text, View } = primitives;
    const markup = renderToStaticMarkup(
      createElement(
        View,
        { testID: "project-actions" },
        createElement(Text, null, "Project actions"),
        createElement(Pressable, { accessibilityRole: "button" }, "Refresh"),
        createElement(Link, { href: "/settings" }, "Settings"),
        createElement(
          Svg,
          { width: 16, height: 16, viewBox: "0 0 16 16" },
          createElement(Path, { d: "M2 8h12" }),
        ),
      ),
    );

    assert.match(markup, /^<div\b[^>]* data-testid="project-actions"[^>]*>/);
    assert.match(markup, /<div\b[^>]* dir="auto"[^>]*>Project actions<\/div>/);
    assert.match(
      markup,
      /<button\b[^>]* role="button"[^>]* type="button"[^>]*>Refresh<\/button>/,
    );
    assert.match(markup, /<a\b[^>]* href="\/settings"[^>]*>Settings<\/a>/);
    assert.match(
      markup,
      /<svg height="16" width="16" viewBox="0 0 16 16"><path d="M2 8h12"><\/path><\/svg>/,
    );
  },
);
