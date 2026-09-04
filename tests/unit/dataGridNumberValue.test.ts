import assert from "node:assert/strict";
import test from "node:test";

import { parseDecimalString } from "../../src/data-grid/dataGridNumberValue";

test("parseDecimalString keeps precision a JS number would destroy", () => {
  // The whole point of the mode: each of these is a different value that
  // Number(...) collapses onto the same float.
  for (const exact of [
    "0.1000000000000000055",
    "0.1000000000000000056",
    "9007199254740993", // Number.MAX_SAFE_INTEGER + 2
    "123456789012345678901234567890.123456789",
  ]) {
    assert.equal(parseDecimalString(exact), exact);
  }
});

test("parseDecimalString accepts canonical dot-decimal syntax", () => {
  assert.equal(parseDecimalString("0"), "0");
  assert.equal(parseDecimalString("42"), "42");
  assert.equal(parseDecimalString("-12.5"), "-12.5");
  assert.equal(parseDecimalString("3.14159"), "3.14159");
  // Outer whitespace is trimmed, as a TSV cell may carry it.
  assert.equal(parseDecimalString("  7.25  "), "7.25");
});

test("parseDecimalString normalizes without rounding", () => {
  assert.equal(parseDecimalString("+5"), "5"); // leading + dropped
  assert.equal(parseDecimalString("007"), "7"); // redundant zeros dropped
  assert.equal(parseDecimalString(".5"), "0.5"); // integer digit supplied
  assert.equal(parseDecimalString("-.5"), "-0.5");
  assert.equal(parseDecimalString("1."), "1"); // trailing bare dot dropped
  assert.equal(parseDecimalString("000"), "0");
});

test("parseDecimalString preserves trailing zeros", () => {
  // The library preserves the representation; trimming 7.500 to 7.5 is the
  // consumer's canonicalization policy, not the grid's.
  assert.equal(parseDecimalString("007.500"), "7.500");
  assert.equal(parseDecimalString("1234.50"), "1234.50");
  assert.equal(parseDecimalString("0.000"), "0.000");
});

test("parseDecimalString emits no negative zero", () => {
  // -0 and 0 are the same value; one text form keeps them from round-tripping
  // as two. The scale still survives.
  assert.equal(parseDecimalString("-0"), "0");
  assert.equal(parseDecimalString("-0.0"), "0.0");
  assert.equal(parseDecimalString("-0.00"), "0.00");
  assert.equal(parseDecimalString("-000"), "0");
  // A non-zero negative keeps its sign.
  assert.equal(parseDecimalString("-0.01"), "-0.01");
});

test("parseDecimalString rejects grouped and localized numbers", () => {
  // Reading these would mean guessing a locale. 0,001 is 1 in en-US grouping
  // and 0.001 in de-DE — rejecting is the only answer that is never wrong.
  for (const text of [
    "1,234",
    "0,001",
    "1,234.56",
    "1.234,56",
    "1.234.567",
    "1 234",
    "1 234", // NBSP group separator, as spreadsheets emit
  ]) {
    assert.equal(parseDecimalString(text), null, text);
  }
});

test("parseDecimalString rejects currency, whitespace and stray characters", () => {
  for (const text of [
    "$5",
    "5$",
    "1$2",
    "1 2",
    "£1.50",
    "5%",
    "12px",
    "1.2.3",
    "--1",
    "1-",
    "",
    "   ",
    "-",
    "+",
    ".",
    "-.",
  ]) {
    assert.equal(parseDecimalString(text), null, JSON.stringify(text));
  }
});

test("parseDecimalString rejects exponents and non-finite words", () => {
  // Expanding 1e999999999 would allocate a gigabyte before anything could
  // reject it, so the exponent form is refused outright.
  for (const text of [
    "1e5",
    "1E5",
    "1.5e3",
    "1.23E-7",
    "1e999999999",
    "NaN",
    "Infinity",
    "-Infinity",
  ]) {
    assert.equal(parseDecimalString(text), null, text);
  }
});

test("parseDecimalString round-trips its own output", () => {
  // Normalization is idempotent: re-parsing a stored value never changes it,
  // so a cell edited twice does not drift.
  for (const text of ["7.500", "0", "-12.5", "0.00", "42"]) {
    const once = parseDecimalString(text);
    assert.equal(parseDecimalString(once!), once, text);
  }
});

test("parseDecimalString returns null for non-string input", () => {
  // Public API: a consumer validating a not-yet-migrated row hands us whatever
  // DataGridCellValue holds. Reporting "not a decimal" beats throwing inside
  // their save path.
  for (const value of [null, undefined, 7.5, true, [], {}, ["1"]]) {
    assert.equal(
      parseDecimalString(value as unknown as string),
      null,
      JSON.stringify(value ?? String(value)),
    );
  }
});
