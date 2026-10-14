/** Native-safe no-op overlay fallback for drag selection. */
import type { DragSelectableActiveDrag } from "./dragSelectableSession";
import type { DragSelectableSelectionLabel } from "./dragSelectableTypes";
import type { SharedUiTheme } from "../theme";

export function DragSelectableOverlay(_props: {
  activeDrag: DragSelectableActiveDrag | null;
  overlayZIndex?: number;
  selectionLabel?: DragSelectableSelectionLabel;
  theme: SharedUiTheme;
}) {
  return null;
}
