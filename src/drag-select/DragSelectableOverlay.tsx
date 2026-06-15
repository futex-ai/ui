/** Native-safe no-op overlay fallback for drag selection. */
import type { DragSelectableBox } from "./dragSelectableModel";
import type { DragSelectableTargetSnapshot } from "./dragSelectableTypes";
import type { SharedUiTheme } from "../theme";

export type DragSelectableActiveDrag = {
  box: DragSelectableBox | null;
  matchedTargets: DragSelectableTargetSnapshot[];
  moved: boolean;
};

export function DragSelectableOverlay(_props: {
  activeDrag: DragSelectableActiveDrag | null;
  overlayZIndex?: number;
  selectionLabel?: (count: number) => string;
  theme: SharedUiTheme;
}) {
  return null;
}
