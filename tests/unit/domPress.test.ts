import assert from "node:assert/strict";
import test from "node:test";

import { isPrimaryPointerDown } from "../../src/primitives/dom/pressMachine";
import { isTextInputNode } from "../../src/primitives/dom/platform";

/**
 * The two pure gates the DOM backend's interaction code sits behind. Both are
 * transcriptions: `isPrimaryPointerDown` from `react-native-web`'s responder
 * `utils.js`, `isTextInputNode` from the field test its `Keyboard.dismiss` made
 * through `TextInputState.blurTextInput`.
 */

const mouse = (over: Record<string, unknown> = {}) => ({
  altKey: false,
  button: 0,
  buttons: 1,
  ctrlKey: false,
  pointerType: "mouse",
  ...over,
});

test("only a primary, unmodified pointer starts a press", () => {
  assert.equal(isPrimaryPointerDown(mouse()), true);
  // A secondary or middle button belongs to the context menu, not to a press.
  assert.equal(isPrimaryPointerDown(mouse({ button: 2, buttons: 2 })), false);
  assert.equal(isPrimaryPointerDown(mouse({ button: 1, buttons: 4 })), false);
  // Alt and Control are the modifiers that backend checks; Meta is not.
  assert.equal(isPrimaryPointerDown(mouse({ ctrlKey: true })), false);
  assert.equal(isPrimaryPointerDown(mouse({ altKey: true })), false);
  assert.equal(isPrimaryPointerDown(mouse({ metaKey: true })), true);
  // Touch always counts, whatever the synthesized button says.
  assert.equal(
    isPrimaryPointerDown({ button: -1, buttons: 0, pointerType: "touch" }),
    true,
  );
  assert.equal(isPrimaryPointerDown({ pointerType: "pen" }), false);
});

test("the keyboard is only dismissed from a text field", () => {
  assert.equal(isTextInputNode({ tagName: "INPUT" }), true);
  assert.equal(isTextInputNode({ tagName: "textarea" }), true);
  assert.equal(
    isTextInputNode({ isContentEditable: true, tagName: "DIV" }),
    true,
  );
  // A focused button keeps its focus: there is no keyboard open for it.
  assert.equal(isTextInputNode({ tagName: "BUTTON" }), false);
  assert.equal(isTextInputNode({ tagName: "DIV" }), false);
  assert.equal(isTextInputNode(null), false);
});
