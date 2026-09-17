import assert from "node:assert/strict";
import test from "node:test";

import {
  isEventComposing,
  isSelectionStale,
  pickTextInputProps,
  resolveInputType,
  textInputDefaults,
} from "../../src/primitives/dom/textInputProps";

/**
 * The pure prop mapping behind `dom/TextInput.tsx`, transcribed from
 * `react-native-web`'s `exports/TextInput/index.js`.
 */

test("inputMode names the type, and secureTextEntry overrides it", () => {
  assert.deepEqual(resolveInputType({ inputMode: "email" }), {
    inputMode: "email",
    type: "email",
  });
  assert.deepEqual(resolveInputType({ inputMode: "decimal" }), {
    inputMode: "decimal",
    type: "text",
  });
  assert.deepEqual(
    resolveInputType({ inputMode: "email", secureTextEntry: true }),
    { inputMode: "email", type: "password" },
  );
});

test("the deprecated keyboardType still maps onto type and inputMode", () => {
  assert.deepEqual(resolveInputType({ keyboardType: "email-address" }), {
    inputMode: undefined,
    type: "email",
  });
  assert.deepEqual(resolveInputType({ keyboardType: "numeric" }), {
    inputMode: "numeric",
    type: undefined,
  });
  assert.deepEqual(resolveInputType({ keyboardType: "decimal-pad" }), {
    inputMode: "decimal",
    type: undefined,
  });
  assert.deepEqual(resolveInputType({ keyboardType: "phone-pad" }), {
    inputMode: undefined,
    type: "tel",
  });
  assert.deepEqual(resolveInputType({ keyboardType: "default" }), {
    inputMode: undefined,
    type: "text",
  });
  // `inputMode` wins outright when both are given.
  assert.deepEqual(
    resolveInputType({ inputMode: "search", keyboardType: "numeric" }),
    { inputMode: "search", type: "search" },
  );
  // Neither given means neither attribute is written.
  assert.deepEqual(resolveInputType({}), {
    inputMode: undefined,
    type: undefined,
  });
});

test("only the allowlisted props and handlers reach the element", () => {
  const picked = pickTextInputProps({
    accessibilityLabel: "Name",
    hitSlop: 8,
    maxLength: 10,
    onChangeText: () => {},
    onKeyDown: () => {},
    onPointerDown: () => {},
    placeholder: "Your name",
    value: "a",
  });
  assert.deepEqual(Object.keys(picked).sort(), [
    "maxLength",
    "onKeyDown",
    "onPointerDown",
    "placeholder",
    "value",
  ]);
  // React Native-only props and callbacks are dropped, as that backend dropped
  // them; `accessibilityLabel` is mapped separately by `domProps.ts`.
  assert.equal("hitSlop" in picked, false);
  assert.equal("onChangeText" in picked, false);
});

test("the defaults match the ones that backend applied", () => {
  assert.deepEqual(textInputDefaults({}), {
    autoCapitalize: "sentences",
    autoComplete: "on",
    autoCorrect: "on",
    dir: "auto",
    enterKeyHint: undefined,
    readOnly: false,
    rows: 1,
    spellCheck: true,
    virtualkeyboardpolicy: "auto",
  });
});

test("rows follow numberOfLines only on a multiline field", () => {
  assert.equal(
    textInputDefaults({ multiline: true, numberOfLines: 4 }).rows,
    4,
  );
  assert.equal(textInputDefaults({ multiline: true, rows: 6 }).rows, 6);
  // A single-line field is always one row, whatever it was told.
  assert.equal(textInputDefaults({ numberOfLines: 4 }).rows, 1);
});

test("editable, readOnly, autoCorrect and the keyboard policy map through", () => {
  assert.equal(textInputDefaults({ editable: false }).readOnly, true);
  assert.equal(textInputDefaults({ readOnly: true }).readOnly, true);
  assert.equal(textInputDefaults({ autoCorrect: false }).autoCorrect, "off");
  // `spellCheck` falls back to `autoCorrect` rather than to `true`.
  assert.equal(textInputDefaults({ autoCorrect: false }).spellCheck, false);
  assert.equal(
    textInputDefaults({ autoCorrect: false, spellCheck: true }).spellCheck,
    true,
  );
  assert.equal(
    textInputDefaults({ showSoftInputOnFocus: false }).virtualkeyboardpolicy,
    "manual",
  );
  assert.equal(textInputDefaults({ returnKeyType: "go" }).enterKeyHint, "go");
});

test("an IME composition is not a submit", () => {
  assert.equal(isEventComposing({ isComposing: true }), true);
  // The spec's sentinel for "the IME handled this".
  assert.equal(isEventComposing({ keyCode: 229 }), true);
  assert.equal(isEventComposing({ keyCode: 13 }), false);
});

test("a selection is stale unless both ends already match", () => {
  const node = { selectionEnd: 4, selectionStart: 2 };
  assert.equal(isSelectionStale(node, { end: 4, start: 2 }), false);
  assert.equal(isSelectionStale(node, { end: 5, start: 2 }), true);
  // A collapsed selection written without an `end` always re-applies, which is
  // what that backend did and what callers moving a caret rely on.
  assert.equal(isSelectionStale(node, { start: 2 }), true);
});
