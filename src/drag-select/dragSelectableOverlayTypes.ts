/** The props that a provider hands to its marquee overlay. */
import type { ReactNode } from "react";

import type { DragSelectableMarquee } from "./dragSelectableOptionTypes";
import type { DragSelectableActiveDrag } from "./dragSelectableSession";
import type { DragSelectableSelectionLabel } from "./dragSelectableTypes";
import type { SharedUiTheme } from "../theme";

/** What the provider hands to its overlay. */
export type DragSelectableOverlayProps = {
  activeDrag: DragSelectableActiveDrag | null;
  marqueeLabel?: string | null;
  overlayZIndex?: number;
  renderMarquee?: (marquee: DragSelectableMarquee) => ReactNode;
  selectionLabel?: DragSelectableSelectionLabel;
  theme: SharedUiTheme;
};
