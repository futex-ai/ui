/**
 * Web bottom sheet. Reuses the modal frame's `bottom-sheet` placement (DOM
 * portal, height animation, focus trap, escape-layer dismissal) so the web
 * sheet and the web modal share one implementation. Native uses `Sheet.tsx`.
 */
import { useWindowDimensions } from "react-native";

import { WebModalFrame } from "../modal";

import { sheetMaxHeight } from "./sheetModel";
import type { SheetProps } from "./types";

export function Sheet({
  children,
  dismissLabel,
  hideHeader = false,
  label,
  maxHeight,
  onClose,
  open,
  title,
}: SheetProps) {
  const { height } = useWindowDimensions();
  const cap = sheetMaxHeight(maxHeight, height);
  const body =
    typeof children === "function"
      ? children({ close: onClose, maxHeight: cap })
      : children;
  return (
    <WebModalFrame
      // `hideHeader` only drops the close control on web; the modal frame always
      // shows the title. The full headerless sheet is a native affordance.
      closeLabel={dismissLabel}
      onClose={onClose}
      placement="bottom-sheet"
      showCloseButton={!hideHeader}
      title={title ?? label}
      visible={open}
    >
      {body}
    </WebModalFrame>
  );
}
