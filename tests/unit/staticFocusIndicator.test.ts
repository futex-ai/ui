import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";

/** Renders the ring-bearing controls with one focus indicator, globally or per control. */
async function renderIndicatorRow(
  indicator: "outline" | "none",
  global: boolean,
): Promise<string> {
  const { Button, Input, SharedUiThemeProvider, Switch, createSharedUiTheme } =
    await loadBuiltUi();
  const focusIndicator = global ? undefined : indicator;
  return renderToStaticMarkup(
    createElement(
      SharedUiThemeProvider,
      global
        ? { theme: createSharedUiTheme({ focusIndicator: indicator }) }
        : null,
      createElement(
        Button,
        { focusIndicator, onPress: () => undefined },
        "Save",
      ),
      createElement(Input, {
        accessibilityLabel: "Project name",
        focusIndicator,
        onChangeText: () => undefined,
        value: "Firna",
      }),
      createElement(Switch, {
        accessibilityLabel: "Notifications",
        focusIndicator,
        onValueChange: () => undefined,
        value: true,
      }),
    ),
  );
}

test(
  "static outline opt-outs omit the ring marker and inline outline reset",
  { skip: !testBuilt },
  async () => {
    for (const global of [false, true]) {
      const markup = await renderIndicatorRow("outline", global);
      assert.doesNotMatch(markup, /data-firna-focus-ring=/);
      assert.doesNotMatch(markup, /data-firna-focus-none=/);
      // Split controls mark the visible box so the outline lands there.
      assert.match(markup, /data-firna-focus-host="descendant"/);
      assert.match(markup, /data-firna-focus-host="parent"/);
      assert.doesNotMatch(markup, /outline(?:-style)?:/);
    }
  },
);

test(
  "static no-indicator controls carry only the no-indicator marker",
  { skip: !testBuilt },
  async () => {
    for (const global of [false, true]) {
      const markup = await renderIndicatorRow("none", global);
      assert.match(markup, /<button[^>]*data-firna-focus-none="self"/);
      assert.match(markup, /data-firna-focus-none="descendant"/);
      assert.match(markup, /data-firna-focus-none="parent"/);
      assert.match(markup, /data-firna-focus-target="true"/);
      // No glow marker, no host marker to restore the outline on the box, and
      // the outline reset lives in CSS rather than an inline style.
      assert.doesNotMatch(markup, /data-firna-focus-ring=/);
      assert.doesNotMatch(markup, /data-firna-focus-host=/);
      assert.doesNotMatch(markup, /data-firna-focus-ring-inset=/);
      assert.doesNotMatch(markup, /outline(?:-style)?:/);
    }
  },
);

test(
  "a per-control focus indicator overrides the theme default",
  { skip: !testBuilt },
  async () => {
    const { Button, SharedUiThemeProvider, createSharedUiTheme } =
      await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        { theme: createSharedUiTheme({ focusIndicator: "none" }) },
        createElement(
          Button,
          { focusIndicator: "ring", onPress: () => undefined },
          "Ring",
        ),
        createElement(Button, { onPress: () => undefined }, "Inherited"),
      ),
    );

    const [ring, inherited] = [...markup.matchAll(/<button[^>]*>/g)].map(
      (match) => match[0],
    );
    assert.match(ring, /data-firna-focus-ring="self"/);
    assert.doesNotMatch(ring, /data-firna-focus-none/);
    assert.match(inherited, /data-firna-focus-none="self"/);
    assert.doesNotMatch(inherited, /data-firna-focus-ring/);
  },
);
