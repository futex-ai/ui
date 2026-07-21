/** Plain-text edit inference for native TextInput reconciliation. */

/** Plain-text selection offsets reported by a native block TextInput. */
export type NativeTextSelection = { end: number; start: number };

/** Replaced range and inserted text inferred from one native change event. */
export type NativeTextEdit = {
  from: number;
  insertedText: string;
  to: number;
};

/** Infer the replaced range, preferring the selection captured before input. */
export function inferNativeTextEdit(
  before: string,
  after: string,
  selection: NativeTextSelection,
): NativeTextEdit {
  const start = clamp(selection.start, 0, before.length);
  const end = clamp(selection.end, start, before.length);
  const insertedLength = after.length - (before.length - (end - start));
  if (
    insertedLength >= 0 &&
    after.slice(0, start) === before.slice(0, start) &&
    after.slice(start + insertedLength) === before.slice(end)
  ) {
    return {
      from: start,
      insertedText: after.slice(start, start + insertedLength),
      to: end,
    };
  }
  let from = 0;
  while (from < before.length && before[from] === after[from]) {
    from += 1;
  }
  let suffix = 0;
  while (
    suffix < before.length - from &&
    suffix < after.length - from &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return {
    from,
    insertedText: after.slice(from, after.length - suffix),
    to: before.length - suffix,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
