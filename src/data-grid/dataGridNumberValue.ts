/**
 * Exact decimal-string parsing for `number` columns in
 * `numberValueMode: "decimalString"` — pure, React-free (unit-tested).
 *
 * Nothing here converts through JavaScript's `Number`, so a value never loses
 * precision on its way through the grid: a 30-digit decimal survives an edit or
 * a paste digit-for-digit, where `Number("0.1000000000000000055")` would
 * silently collapse to `0.1`.
 *
 * The accepted syntax is canonical dot-decimal only — an optional sign, digits,
 * an optional `.` fraction. No grouping separator, currency symbol, internal
 * whitespace or exponent, which means no locale ever has to be guessed (`0,001`
 * is rejected rather than read as `1`) and no input can expand into an
 * unbounded allocation (`1e999999999`).
 */

/** Canonical dot-decimal syntax: `007`, `-12.50`, `+5`, `.5`, `1.`. */
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/** True for a decimal whose digits are all zero (`0`, `0.0`, `0.00`). */
const ZERO_PATTERN = /^0(?:\.0*)?$/;

/**
 * Parse `text` as an exact decimal string, or return `null` when it is not a
 * decimal.
 *
 * The result is *normalized* but never rounded: a leading `+` is dropped, the
 * integer part loses redundant leading zeros and gains a `0` when absent, a
 * trailing bare `.` is dropped, and a zero value loses its sign. Fractional
 * digits are returned exactly as written, so `007.500` normalizes to `7.500`
 * with its scale intact. Canonicalizing that representation further — trimming
 * `7.500` to `7.5` — is the consumer's policy, not the grid's: the library
 * preserves the representation you typed, and the backend owns canonical form.
 */
export function parseDecimalString(text: string): string | null {
  // Guarded because this is public API and `DataGridCellValue` is a union: a
  // consumer validating a not-yet-migrated row would otherwise hand us the JS
  // number still in the cell and get a TypeError out of its save path.
  if (typeof text !== "string") {
    return null;
  }
  const trimmed = text.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "");
  const [rawInteger = "", fraction = ""] = unsigned.split(".");
  // Drop redundant leading zeros ("007" → "7") while keeping one digit, so a
  // bare fraction (".5") and an all-zero integer ("000") both land on "0".
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  const digits = fraction === "" ? integer : `${integer}.${fraction}`;
  // `-0`, `-0.0` and `-0.00` are zero: emit the unsigned form so an identical
  // value never round-trips as two different strings.
  return negative && !ZERO_PATTERN.test(digits) ? `-${digits}` : digits;
}
