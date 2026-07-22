import assert from "node:assert/strict";
import test from "node:test";

import {
  nativeRichTextAccessoryTargets,
  scheduleNativeRichTextFocusHandoff,
  shouldClearNativeEditorFocus,
} from "../../src/rich-text/nativeRichTextFocus";

test("registers one iOS toolbar host for every editable native block", () => {
  const targets = nativeRichTextAccessoryTargets(
    "editor-accessory",
    ["paragraph", "divider", "heading1"],
    2,
  );

  assert.deepEqual(targets, [
    { block: 0, id: "editor-accessory-0", visible: false },
    { block: 2, id: "editor-accessory-2", visible: true },
  ]);
});

test("ignores a stale blur after Enter moves focus to the next block", () => {
  assert.equal(shouldClearNativeEditorFocus(1, 0), false);
});

test("clears editor focus when the active block itself blurs", () => {
  assert.equal(shouldClearNativeEditorFocus(1, 1), true);
});

test("defers the native first-responder handoff until the next frame", () => {
  const calls: string[] = [];
  let frame: (() => void) | undefined;
  const frameId = scheduleNativeRichTextFocusHandoff({
    input: {
      focus: () => calls.push("focus"),
      setNativeProps: ({ selection }) =>
        calls.push(`selection:${selection.start}-${selection.end}`),
    },
    isCurrent: () => true,
    onHandled: () => calls.push("handled"),
    scheduleFrame: (callback) => {
      frame = callback;
      return 17;
    },
    selection: { end: 3, start: 3 },
  });

  assert.equal(frameId, 17);
  assert.deepEqual(calls, []);
  assert.ok(frame);
  frame();
  assert.deepEqual(calls, ["handled", "focus", "selection:3-3"]);
});

test("drops a superseded native focus handoff", () => {
  let frame: (() => void) | undefined;
  let focused = false;
  scheduleNativeRichTextFocusHandoff({
    input: {
      focus: () => {
        focused = true;
      },
      setNativeProps: () => undefined,
    },
    isCurrent: () => false,
    onHandled: () => assert.fail("superseded request was handled"),
    scheduleFrame: (callback) => {
      frame = callback;
      return 1;
    },
    selection: { end: 0, start: 0 },
  });

  assert.ok(frame);
  frame();
  assert.equal(focused, false);
});
