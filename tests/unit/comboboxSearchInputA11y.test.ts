import assert from "node:assert/strict";
import test from "node:test";

import {
  comboboxFieldDescriptionA11y,
  comboboxSearchInputA11y,
} from "../../src/dropdown/comboboxSearchInputA11y";
import type { ComboboxSearchInputA11yOptions } from "../../src/dropdown/comboboxSearchInputA11y";

const ids = { errorId: "f-error", hintId: "f-hint", labelId: "f-label" };

function options(
  overrides: Partial<ComboboxSearchInputA11yOptions>,
): ComboboxSearchInputA11yOptions {
  return {
    error: "Select a tag.",
    hint: "One tag per group.",
    ids,
    invalid: true,
    isWeb: true,
    label: "Tags",
    placeholder: "Add tag",
    placement: "field",
    required: true,
    ...overrides,
  };
}

test("the field input is named by the visible label and described by the error and hint", () => {
  assert.deepEqual(comboboxSearchInputA11y(options({})), {
    accessibilityHint: "Select a tag.",
    accessibilityLabel: undefined,
    "aria-describedby": "f-error f-hint",
    "aria-errormessage": "f-error",
    "aria-invalid": true,
    "aria-labelledby": "f-label",
    "aria-required": true,
  });
});

test("an explicit accessibilityLabel names both inputs", () => {
  for (const placement of ["field", "sheet"] as const) {
    const props = comboboxSearchInputA11y(
      options({ accessibilityLabel: "Transaction tags", placement }),
    ) as Record<string, unknown>;
    assert.equal(props.accessibilityLabel, "Transaction tags", placement);
    assert.equal(props["aria-labelledby"], undefined, placement);
  }
});

test("the sheet input takes the label text, else the placeholder, and keeps the description", () => {
  const sheet = comboboxSearchInputA11y(
    options({ placement: "sheet" }),
  ) as Record<string, unknown>;
  assert.equal(sheet.accessibilityLabel, "Tags");
  assert.equal(sheet["aria-describedby"], "f-error f-hint");
  assert.equal(sheet["aria-errormessage"], "f-error");
  const bare = comboboxSearchInputA11y(
    options({ label: undefined, placement: "sheet" }),
  ) as Record<string, unknown>;
  assert.equal(bare.accessibilityLabel, "Add tag");
});

test("native inputs read the hint and get no aria description", () => {
  assert.deepEqual(
    comboboxFieldDescriptionA11y({
      error: null,
      hint: "One tag per group.",
      ids,
      isWeb: false,
    }),
    { accessibilityHint: "One tag per group." },
  );
});

test("a field without messages has no description", () => {
  assert.deepEqual(
    comboboxFieldDescriptionA11y({ error: undefined, ids, isWeb: true }),
    {
      accessibilityHint: undefined,
      "aria-describedby": undefined,
      "aria-errormessage": undefined,
    },
  );
});
