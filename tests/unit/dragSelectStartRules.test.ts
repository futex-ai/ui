import assert from "node:assert/strict";
import test from "node:test";

import { dragSelectableDefaultDragMode } from "../../src/drag-select/dragSelectableOptions";
import type {
  DragSelectableModifierKeys,
  DragSelectableStart,
} from "../../src/drag-select/dragSelectableOptionTypes";
import {
  DRAG_SELECTABLE_FIELD_SELECTOR,
  dragSelectableStartDecision,
} from "../../src/drag-select/dragSelectableStartRules";
import type { DragSelectableTargetRegistration } from "../../src/drag-select/dragSelectableTypes";

import { asElement, FakeElement } from "./dragSelectFakeDom";

const noKeys: DragSelectableModifierKeys = {
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

const textInputPart = DRAG_SELECTABLE_FIELD_SELECTOR.split(",")[0];

/**
 * A provider with one row (`row_1`, a11yProps on the row), a row whose
 * a11yProps sit on a child (`row_2`), a disabled row (`row_3`), a row wrapped
 * in a link (`row_4`), and a toolbar outside every row.
 */
function page() {
  const provider = new FakeElement();
  const row = provider
    .append(new FakeElement(["[role='checkbox']"]))
    .attr("data-drag-select-target", "row_1");
  const rowText = row.append(new FakeElement());
  const button = row.append(new FakeElement(["button"]));
  const buttonLabel = button.append(new FakeElement());
  const input = row.append(new FakeElement([textInputPart]));
  const editable = row.append(
    new FakeElement(["[contenteditable]:not([contenteditable='false' i])"]),
  );
  const notes = row
    .append(new FakeElement())
    .attr("data-drag-select-ignore", "true");
  const childRow = provider.append(new FakeElement());
  const childCheckbox = childRow
    .append(new FakeElement(["[role='checkbox']"]))
    .attr("data-drag-select-target", "row_2");
  const disabledRow = provider.append(new FakeElement());
  const disabledButton = disabledRow.append(new FakeElement(["button"]));
  const link = provider.append(new FakeElement(["a[href]"]));
  const linkedRow = link.append(new FakeElement());
  const linkedText = linkedRow.append(new FakeElement());
  const toolbarButton = provider.append(new FakeElement(["button"]));
  const targets: DragSelectableTargetRegistration[] = [
    registration("row_1", row),
    registration("row_2", childRow),
    { ...registration("row_3", disabledRow), disabled: true },
    registration("row_4", linkedRow),
  ];
  return {
    button,
    buttonLabel,
    childCheckbox,
    disabledButton,
    editable,
    input,
    linkedText,
    notes,
    provider,
    row,
    rowText,
    targets,
    toolbarButton,
  };
}

function registration(
  id: string,
  node: FakeElement,
): DragSelectableTargetRegistration {
  return {
    id,
    node: node as unknown as DragSelectableTargetRegistration["node"],
  };
}

function decide(
  element: FakeElement,
  fixture: ReturnType<typeof page>,
  overrides: {
    ignore?: readonly string[];
    keys?: Partial<DragSelectableModifierKeys>;
    shouldStartDrag?: (start: DragSelectableStart) => boolean;
    startFromControls?: boolean;
  } = {},
) {
  return dragSelectableStartDecision({
    element: asElement(element),
    event: {} as PointerEvent,
    keys: { ...noKeys, ...overrides.keys },
    options: {
      dragMode: dragSelectableDefaultDragMode,
      ignore: overrides.ignore ?? [],
      shouldStartDrag: overrides.shouldStartDrag,
      startFromControls: overrides.startFromControls ?? true,
    },
    provider: asElement(fixture.provider),
    targets: fixture.targets,
  });
}

test("drag-select allows a press on row content and on the row itself", () => {
  const fixture = page();
  for (const element of [fixture.rowText, fixture.row, fixture.provider]) {
    const decision = decide(element, fixture);
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, null);
    assert.equal(decision.onControl, false);
    assert.equal(decision.mode, "replace");
  }
  assert.equal(decide(fixture.rowText, fixture).targetId, "row_1");
  assert.equal(decide(fixture.provider, fixture).targetId, null);
});

test("drag-select counts the element with a target's a11yProps as the target", () => {
  const fixture = page();
  const decision = decide(fixture.childCheckbox, fixture);
  assert.equal(decision.allowed, true);
  assert.equal(decision.onControl, false);
  assert.equal(decision.targetId, "row_2");
});

test("drag-select refuses a press with Control or Alt held", () => {
  const fixture = page();
  for (const keys of [{ ctrlKey: true }, { altKey: true }]) {
    const decision = decide(fixture.rowText, fixture, { keys });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "modifier");
    assert.equal(decision.mode, null);
  }
  assert.equal(
    decide(fixture.rowText, fixture, { keys: { shiftKey: true } }).mode,
    "add",
  );
  assert.equal(
    decide(fixture.rowText, fixture, { keys: { metaKey: true } }).mode,
    "toggle",
  );
});

test("drag-select refuses a press inside the ignore marker or an ignore selector", () => {
  const fixture = page();
  assert.equal(decide(fixture.notes, fixture).reason, "ignored");
  fixture.rowText.attr("data-notes", "true");
  assert.equal(
    decide(fixture.rowText, fixture, { ignore: ["[data-notes]"] }).reason,
    "ignored",
  );
  assert.equal(decide(fixture.rowText, fixture).reason, null);
});

test("drag-select ignores selector matches outside the provider", () => {
  const fixture = page();
  const shell = new FakeElement().attr("data-shell", "true");
  shell.append(fixture.provider);
  assert.equal(
    decide(fixture.rowText, fixture, { ignore: ["[data-shell]"] }).allowed,
    true,
  );
});

test("drag-select refuses a press inside a field", () => {
  const fixture = page();
  assert.equal(decide(fixture.input, fixture).reason, "field");
  assert.equal(decide(fixture.editable, fixture).reason, "field");
});

test("drag-select allows a control inside an enabled row and refuses the rest", () => {
  const fixture = page();
  const inRow = decide(fixture.buttonLabel, fixture);
  assert.equal(inRow.allowed, true);
  assert.equal(inRow.onControl, true);
  assert.equal(inRow.targetId, "row_1");

  const toolbar = decide(fixture.toolbarButton, fixture);
  assert.equal(toolbar.reason, "control");
  assert.equal(toolbar.onControl, true);
  assert.equal(decide(fixture.disabledButton, fixture).reason, "control");
  assert.equal(
    decide(fixture.button, fixture, { startFromControls: false }).reason,
    "control",
  );
});

test("drag-select does not search a control that contains the target root", () => {
  const fixture = page();
  const decision = decide(fixture.linkedText, fixture);
  assert.equal(decision.allowed, true);
  assert.equal(decision.onControl, false);
  assert.equal(decision.targetId, "row_4");
});

test("drag-select applies the default rules in order", () => {
  const fixture = page();
  fixture.input.attr("data-drag-select-ignore", "true");
  assert.equal(
    decide(fixture.input, fixture, { keys: { ctrlKey: true } }).reason,
    "modifier",
  );
  assert.equal(decide(fixture.input, fixture).reason, "ignored");
});

test("drag-select lets shouldStartDrag override the default answer both ways", () => {
  const fixture = page();
  const seen: DragSelectableStart[] = [];
  const refused = decide(fixture.rowText, fixture, {
    shouldStartDrag: (start) => {
      seen.push(start);
      return false;
    },
  });
  assert.equal(refused.allowed, false);
  assert.equal(seen[0].allowed, true);
  assert.equal(seen[0].reason, null);
  assert.equal(seen[0].targetId, "row_1");
  assert.equal(seen[0].element, asElement(fixture.rowText));

  const field = decide(fixture.input, fixture, { shouldStartDrag: () => true });
  assert.equal(field.allowed, true);
  assert.equal(field.reason, "field");

  const modifier = decide(fixture.rowText, fixture, {
    keys: { ctrlKey: true },
    shouldStartDrag: (start) => {
      assert.equal(start.mode, null);
      assert.equal(start.reason, "modifier");
      return true;
    },
  });
  assert.equal(modifier.allowed, true);
  assert.equal(modifier.mode, "replace");
});

test("drag-select treats an invalid ignore selector as no match and warns once", (context) => {
  const fixture = page();
  const globals = globalThis as { __DEV__?: boolean };
  const hadDev = "__DEV__" in globals;
  const previousDev = globals.__DEV__;
  globals.__DEV__ = true;
  const warn = context.mock.method(console, "warn", () => undefined);
  try {
    const selector = "[data-notes!!";
    assert.equal(
      decide(fixture.rowText, fixture, { ignore: [selector] }).allowed,
      true,
    );
    assert.equal(
      decide(fixture.rowText, fixture, { ignore: [selector] }).allowed,
      true,
    );
    assert.equal(warn.mock.callCount(), 1);
    assert.match(
      String(warn.mock.calls[0].arguments[0]),
      /not a valid CSS selector/,
    );
  } finally {
    if (hadDev) {
      globals.__DEV__ = previousDev;
    } else {
      delete globals.__DEV__;
    }
  }
});
