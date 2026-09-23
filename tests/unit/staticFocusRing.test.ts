import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const distEntry = new URL("../../dist/node/index.js", import.meta.url);
const testBuilt = process.env.FIRNA_TEST_DIST === "1" && existsSync(distEntry);

async function loadBuiltUi() {
  return import(distEntry.href);
}

test(
  "static Button and Input markup carries CSS focus markers without outlines",
  { skip: !testBuilt },
  async () => {
    const { Button, Input, SharedUiThemeProvider } = await loadBuiltUi();
    const enabled = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(Button, { onPress: () => undefined }, "Save"),
        createElement(Input, {
          accessibilityLabel: "Project name",
          onChangeText: () => undefined,
          value: "Firna",
        }),
      ),
    );

    assert.match(enabled, /data-firna-focus-ring="self"/);
    assert.match(enabled, /data-firna-focus-ring="descendant"/);
    assert.doesNotMatch(enabled, /outline(?:-style)?:/);
  },
);

test(
  "static focus opt-outs omit the ring marker and inline outline reset",
  { skip: !testBuilt },
  async () => {
    const { Button, Input, SharedUiThemeProvider } = await loadBuiltUi();
    const render = (global: boolean) =>
      renderToStaticMarkup(
        createElement(
          SharedUiThemeProvider,
          global ? { theme: { focusRing: false } } : null,
          createElement(
            Button,
            {
              disableFocusRing: !global,
              onPress: () => undefined,
            },
            "Save",
          ),
          createElement(Input, {
            accessibilityLabel: "Project name",
            disableFocusRing: !global,
            onChangeText: () => undefined,
            value: "Firna",
          }),
        ),
      );

    for (const markup of [render(false), render(true)]) {
      assert.doesNotMatch(markup, /data-firna-focus-ring=/);
      assert.doesNotMatch(markup, /outline(?:-style)?:/);
    }
  },
);

test(
  "static segmented, list, and switch controls expose their CSS geometry",
  { skip: !testBuilt },
  async () => {
    const { ListItem, SegmentedControl, SharedUiThemeProvider, Switch } =
      await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(SegmentedControl, {
          accessibilityLabel: "Cadence",
          onChange: () => undefined,
          options: [
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
          ],
          value: "daily",
        }),
        createElement(ListItem, {
          onPress: () => undefined,
          title: "Open project",
        }),
        createElement(Switch, {
          accessibilityLabel: "Notifications",
          onValueChange: () => undefined,
          value: true,
        }),
      ),
    );

    assert.match(
      markup,
      /data-firna-focus-ring="self" data-firna-focus-ring-inset="true"/,
    );
    assert.match(markup, /data-firna-focus-target="true"/);
    assert.match(markup, /data-firna-focus-ring="parent"/);
    assert.doesNotMatch(markup, /outline(?:-style)?:/);
  },
);

test(
  "static wheel date triggers expose their focus host and target",
  { skip: !testBuilt },
  async () => {
    const { DateField, SharedUiThemeProvider } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(DateField, {
          label: "Year ends",
          onChange: () => undefined,
          value: "2026-03-31",
          variant: "wheel",
        }),
      ),
    );

    assert.match(markup, /data-firna-focus-ring="descendant"/);
    assert.match(markup, /data-firna-focus-target="true"/);
    assert.doesNotMatch(markup, /outline(?:-style)?:/);
  },
);

test(
  "web theme providers serialize focus variables for every preset",
  { skip: !testBuilt },
  async () => {
    const ui = await loadBuiltUi();
    for (const theme of [
      ui.defaultSharedUiTheme,
      ui.junoSharedUiTheme,
      ui.darkSharedUiTheme,
      ui.junoDarkSharedUiTheme,
    ]) {
      const markup = renderToStaticMarkup(
        createElement(
          ui.SharedUiThemeProvider,
          { theme },
          createElement("span", null, "content"),
        ),
      );
      assert.match(markup, /--firna-focus-ring-color:rgba\(/);
      assert.match(markup, /--firna-focus-ring-width:4px/);
    }
  },
);

test(
  "a raw DOM hook host serializes its markers, color, width, and alpha",
  { skip: !testBuilt },
  async () => {
    const ui = await loadBuiltUi();
    function CustomControl() {
      const focus = ui.useFocusRing({
        alpha: 0.5,
        color: "#abc",
        width: 7,
      });
      return createElement("button", {
        ...focus.focusRingDomProps,
        style: focus.focusRingVariables,
      });
    }
    function CustomField() {
      const focus = ui.useFocusRing({ offset: -2, target: "descendant" });
      return createElement(
        "div",
        { ...focus.focusRingDomProps, style: focus.focusRingVariables },
        createElement("input", focus.focusTargetDomProps),
      );
    }

    const markup = renderToStaticMarkup(
      createElement(
        ui.SharedUiThemeProvider,
        null,
        createElement(CustomControl),
        createElement(CustomField),
      ),
    );
    assert.match(markup, /<button data-firna-focus-ring="self"/);
    assert.match(markup, /--firna-focus-ring-color:rgba\(170, 187, 204, 0.5\)/);
    assert.match(markup, /--firna-focus-ring-width:7px/);
    assert.match(
      markup,
      /<div data-firna-focus-host="descendant" data-firna-focus-ring="descendant" data-firna-focus-ring-inset="true"/,
    );
    assert.match(markup, /<input data-firna-focus-target="true"/);
    // A `self` host never serializes an `undefined` host marker.
    assert.doesNotMatch(markup, /="undefined"/);
  },
);

test(
  "static input clear buttons keep the browser outline available",
  { skip: !testBuilt },
  async () => {
    const { Input, SharedUiThemeProvider } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(Input, {
          accessibilityLabel: "Search",
          clearable: true,
          onChangeText: () => undefined,
          value: "Quarterly report",
        }),
      ),
    );

    // The clear action is unmarked, so the frame's rule ignores it; it must not
    // hide its own outline either, or its focus would be invisible.
    assert.match(markup, /aria-label="Clear Search"/);
    assert.doesNotMatch(markup, /outline(?:-style)?:/);
  },
);

test(
  "legacy hook styles keep the hydrated inline focus fallback",
  { skip: !testBuilt },
  async () => {
    const ui = await loadBuiltUi();
    let legacy:
      | {
          focusRingStyle: Record<string, unknown>;
          webOutlineReset: unknown;
        }
      | undefined;

    function LegacyProbe() {
      const focus = ui.useFocusRing({
        alpha: 0.5,
        color: "#abc",
        offset: -2,
        width: 7,
      });
      legacy = {
        focusRingStyle: focus.focusRingStyle,
        webOutlineReset: focus.webOutlineReset,
      };
      return null;
    }

    renderToStaticMarkup(
      createElement(ui.SharedUiThemeProvider, null, createElement(LegacyProbe)),
    );
    assert.deepEqual(legacy?.focusRingStyle, {
      boxShadow: "inset 0 0 0 7px rgba(170, 187, 204, 0.5)",
      outlineStyle: "none",
    });
    assert.equal(legacy?.webOutlineReset, null);
  },
);
