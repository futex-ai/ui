import type { ControlSize } from "./controlSize";

/** A size with its own metrics in every family: every size but the dense `xs`. */
export type StandardControlSize = Exclude<ControlSize, "xs">;

/**
 * Completes the size table of a family without a dense design: `xs` draws
 * with the `sm` metrics, so every size the shared scale names stays valid.
 */
export function withDenseAsSmall<Row>(
  table: Record<StandardControlSize, Row>,
): Record<ControlSize, Row> {
  return { ...table, xs: table.sm };
}

/** The size whose metrics a family without a dense design draws. */
export function standardControlSize(size: ControlSize): StandardControlSize {
  return size === "xs" ? "sm" : size;
}
