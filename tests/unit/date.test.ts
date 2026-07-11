import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("date field threads the shared size scale to its trigger", () => {
  const source = readSource("../../src/date/DateField.tsx");

  // Opt-in size prop, default md, on both the labelled field and the bare input.
  assert.match(source, /size\?: ControlSize;/);
  assert.match(source, /size = "md"/);
  assert.match(source, /createDateFieldStyles\(theme, size\)/);
  // The size flows down into the platform triggers.
  assert.match(source, /<WebTrigger[\s\S]*size=\{size\}/);
  assert.match(source, /<NativeTrigger[\s\S]*size=\{size\}/);
});

test("date range field threads the size to both endpoints", () => {
  const source = readSource("../../src/date/DateRangeField.tsx");

  assert.match(source, /size\?: ControlSize;/);
  assert.match(source, /size = "md"/);
  // The wrapper styles are threaded the size too, staying in lockstep with
  // DateField / DateInput even though today's wrapper tokens are size-independent.
  assert.match(source, /createDateFieldStyles\(theme, size\)/);
  // Both the start and end DateInputs receive the range's size.
  assert.match(
    source,
    /placeholder="Start"[\s\S]*size=\{size\}[\s\S]*placeholder="End"/,
  );
});

test("date trigger styles size the box from the shared input scale", () => {
  const source = readSource("../../src/date/dateFieldStyles.ts");

  // The native trigger box reuses the input's per-size geometry so web and
  // native triggers stay the same height for a given size.
  assert.match(
    source,
    /import \{ fieldChromeTokens, inputSizeTokens \} from "\.\.\/input"/,
  );
  assert.match(source, /const sizing = inputSizeTokens\(size\)/);
  assert.match(source, /height: sizing\.boxHeight/);
  assert.match(source, /paddingHorizontal: sizing\.paddingHorizontal/);
  assert.match(source, /fontSize: sizing\.inputFontSize/);
});

test("native date trigger scales its icons with the size", () => {
  const source = readSource("../../src/date/DateTrigger.tsx");

  assert.match(source, /const iconSize = inputIconSize\(size\)/);
  // Both the clear (✕) and the calendar glyph use the per-size diameter.
  assert.match(
    source,
    /<CircleX color=\{theme\.colors\.muted\} size=\{iconSize\}/,
  );
  assert.match(
    source,
    /<CalendarDays color=\{theme\.colors\.muted\} size=\{iconSize\}/,
  );
});

test("date fields reveal supplementary help from a labelInfo button", () => {
  const fieldSource = readSource("../../src/date/DateField.tsx");
  const rangeSource = readSource("../../src/date/DateRangeField.tsx");
  const stylesSource = readSource("../../src/date/dateFieldStyles.ts");

  // The shared FieldLabel wraps the label + optional ⓘ in one row, reusing the
  // input package's LabelInfo affordance rather than re-implementing it.
  assert.match(fieldSource, /import \{ LabelInfo \} from "\.\.\/input"/);
  assert.match(fieldSource, /<View style=\{styles\.labelRow\}>/);
  assert.match(
    fieldSource,
    /\{labelInfo \? \([\s\S]*?<LabelInfo[\s\S]*?info=\{labelInfo\}[\s\S]*?\) : null\}/,
  );
  // The button's default accessible name derives from the visible label.
  assert.match(fieldSource, /More information about \$\{label\}/);
  // Both the single field and the range field thread labelInfo into FieldLabel.
  assert.match(fieldSource, /<FieldLabel[\s\S]*?labelInfo=\{labelInfo\}/);
  assert.match(rangeSource, /<FieldLabel[\s\S]*?labelInfo=\{labelInfo\}/);
  assert.match(rangeSource, /labelInfo\?: string;/);
  assert.match(stylesSource, /labelRow: \{[\s\S]*?flexDirection: "row"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
