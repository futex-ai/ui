/**
 * The pieces a windowed list renders around its cells.
 *
 * Split out of `FlatList.tsx` to keep both files near the line target: the
 * header / footer / empty slots, the spacers that stand in for the rows above
 * and below the window, and the separator bookkeeping `renderItem` is handed.
 */
import {
  createElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import type { ViewProps } from "../types";

import { View } from "./View";

/** A header, footer or empty slot, in either of the forms a caller may pass. */
export type SlotComponent =
  | ComponentType<unknown>
  | ReactElement
  | null
  | undefined;

/** `renderItem` is handed these; nothing in the library highlights separators. */
export const NO_SEPARATORS = {
  highlight: () => {},
  unhighlight: () => {},
  updateProps: () => {},
};

export const HORIZONTAL_CELL = { flexDirection: "row" } as const;

/** Renders a header / footer / empty slot, whichever form it was given in. */
export function renderSlot(slot: SlotComponent): ReactNode {
  if (slot == null) {
    return null;
  }
  return isValidElement(slot)
    ? slot
    : createElement(slot as ComponentType<unknown>);
}

/** The pixel length of the rows `[from, to]`, which a spacer stands in for. */
export function spacerLength(
  getFrameMetricsApprox: (index: number) => { length: number; offset: number },
  from: number,
  to: number,
): number {
  const last = getFrameMetricsApprox(to);
  return last.offset + last.length - getFrameMetricsApprox(from).offset;
}

export function spacer(
  position: "head" | "tail",
  isHorizontal: boolean,
  length: number,
): ReactElement {
  const style = { [isHorizontal ? "width" : "height"]: length };
  return (
    <View key={`$spacer-${position}`} style={style as ViewProps["style"]} />
  );
}
