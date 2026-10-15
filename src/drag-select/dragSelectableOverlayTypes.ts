/** The props that a provider hands to its marquee overlay. */
import type { SharedUiTheme } from "../theme";

import type { DragSelectableActiveDrag } from "./dragSelectableSession";
import type { DragSelectableOptionSource } from "./useDragSelectableOptionLayers";

/** What the provider hands to its overlay. */
export type DragSelectableOverlayProps = {
  activeDrag: DragSelectableActiveDrag | null;
  /**
   * The live options. The overlay reads `marqueeLabel`, `overlayZIndex`,
   * `renderMarquee`, and `selectionLabel` at its own render, and re-renders
   * when a page hook changes any of them.
   */
  optionSource: DragSelectableOptionSource;
  theme: SharedUiTheme;
};
