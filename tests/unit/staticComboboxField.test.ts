import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";
import { styleValue, tagWith, textStyle } from "./staticMarkup";

/**
 * Server-rendered markup of the `ComboboxMultiSelect` field, from the built
 * web output (`npm run test:dist`). The browser tests in
 * `tests/browser/combobox-field.spec.ts` cover what only a live page shows:
 * the input's description, keyboard navigation, and the focus border.
 */
const BOOKS = [
  { label: "Greenhouse Studio", value: "book_1" },
  { label: "Payroll Reserve", value: "book_2" },
];

async function renderField(props: Record<string, unknown>, theme?: unknown) {
  const { ComboboxMultiSelect, SharedUiThemeProvider } = await loadBuiltUi();
  return renderToStaticMarkup(
    createElement(
      SharedUiThemeProvider,
      theme ? { theme } : null,
      createElement(ComboboxMultiSelect, {
        onChange: () => undefined,
        options: BOOKS,
        values: [],
        ...props,
      }),
    ),
  );
}

const sameColor = (actual: string | undefined, expected: string) =>
  assert.equal(actual?.toLowerCase(), expected.toLowerCase());

test(
  "chips and the placeholder take their colors from the theme",
  { skip: !testBuilt },
  async () => {
    const { defaultSharedUiTheme, junoSharedUiTheme } = await loadBuiltUi();
    for (const theme of [defaultSharedUiTheme, junoSharedUiTheme]) {
      const markup = await renderField({ values: ["book_1"] }, theme);
      assert.ok(
        markup
          .toLowerCase()
          .includes(
            `background-color:${theme.colors.primarySoft.toLowerCase()}`,
          ),
        "the chip fill is the theme's primarySoft",
      );
      sameColor(
        textStyle(markup, "Greenhouse Studio", "color"),
        theme.colors.primaryDeep,
      );
      sameColor(
        styleValue(tagWith(markup, "<input"), "--placeholderTextColor"),
        theme.colors.placeholder,
      );
    }
  },
);

test(
  "the visible label names the input, and accessibilityLabel replaces it",
  { skip: !testBuilt },
  async () => {
    const labelled = await renderField({ label: "Linked books" });
    const labelId = /id="([^"]+-label)"/.exec(labelled)?.[1];
    assert.ok(labelId, "the label carries an id");
    const input = tagWith(labelled, "<input");
    assert.match(input, new RegExp(`aria-labelledby="${labelId}"`));
    assert.doesNotMatch(input, /aria-label=/);

    const named = await renderField({
      accessibilityLabel: "Books to link",
      label: "Linked books",
    });
    const namedInput = tagWith(named, "<input");
    assert.match(namedInput, /aria-label="Books to link"/);
    assert.doesNotMatch(namedInput, /aria-labelledby=/);
  },
);

test(
  "required marks the input and hides the star from assistive tech",
  { skip: !testBuilt },
  async () => {
    const markup = await renderField({ label: "Linked books", required: true });
    assert.match(tagWith(markup, "<input"), /aria-required="true"/);
    assert.match(tagWith(markup, "> *<"), /aria-hidden="true"/);
  },
);

test(
  "an error marks the input invalid, turns the border rose, and is an alert",
  { skip: !testBuilt },
  async () => {
    const { defaultSharedUiTheme } = await loadBuiltUi();
    const { colors } = defaultSharedUiTheme;
    const control = (markup: string) =>
      tagWith(markup, 'data-firna-focus-ring="descendant"');

    const failed = await renderField({
      error: "Select at least one book.",
      label: "Linked books",
    });
    assert.match(tagWith(failed, "<input"), /aria-invalid="true"/);
    sameColor(styleValue(control(failed), "border-top-color"), colors.rose);
    assert.ok(control(failed).includes(colors.roseSoft), "a soft rose ring");
    const alert = tagWith(failed, 'role="alert"');
    assert.match(alert, /aria-live="assertive"/);
    assert.ok(failed.includes(">Select at least one book.<"));

    const forced = await renderField({ invalid: true, label: "Linked books" });
    sameColor(styleValue(control(forced), "border-top-color"), colors.rose);

    const valid = await renderField({ label: "Linked books" });
    assert.match(tagWith(valid, "<input"), /aria-invalid="false"/);
    assert.equal(
      styleValue(control(valid), "border-top-color"),
      colors.controlBorder,
    );
  },
);

test(
  "the control and its input carry the shared focus ring markers",
  { skip: !testBuilt },
  async () => {
    const markup = await renderField({ label: "Linked books" });
    assert.match(markup, /data-firna-focus-ring="descendant"/);
    assert.match(tagWith(markup, "<input"), /data-firna-focus-target="true"/);
    const none = await renderField({
      focusIndicator: "none",
      label: "Linked books",
    });
    assert.match(none, /data-firna-focus-none="descendant"/);
  },
);

test(
  "labelInfo adds an information button named after the label",
  { skip: !testBuilt },
  async () => {
    const markup = await renderField({
      label: "Linked books",
      labelInfo: "Linked books scope the report.",
    });
    assert.match(markup, /aria-label="More information about Linked books"/);
    assert.ok(markup.includes(">Linked books scope the report.<"));

    const custom = await renderField({
      label: "Linked books",
      labelInfo: "Linked books scope the report.",
      labelInfoLabel: "How linked books scope a report",
    });
    assert.match(custom, /aria-label="How linked books scope a report"/);

    const bare = await renderField({ labelInfo: "Ignored without a label." });
    assert.doesNotMatch(bare, /More information/);
  },
);

test(
  "labelInfo without a label warns in development",
  { skip: !testBuilt },
  async (t) => {
    // `devWarn` speaks only when the `__DEV__` global is true, as on native
    // development builds.
    const scope = globalThis as { __DEV__?: boolean };
    scope.__DEV__ = true;
    const warn = mock.method(console, "warn", () => undefined);
    t.after(() => {
      warn.mock.restore();
      delete scope.__DEV__;
    });
    await renderField({ labelInfo: "Ignored without a label." });
    const messages = warn.mock.calls.map((call) => String(call.arguments[0]));
    assert.ok(
      messages.some((message) =>
        message.includes("`labelInfo` needs a `label`"),
      ),
      messages.join("\n"),
    );
  },
);
