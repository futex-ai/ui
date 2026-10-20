/**
 * Web bottom sheet. Reuses the modal frame's `bottom-sheet` placement (DOM
 * portal, height animation, focus trap, escape-layer dismissal) so the web
 * sheet and the web modal share one implementation. Native uses `Sheet.tsx`.
 */
import { useWindowDimensions } from "../primitives/reactNative";

import { WebModalFrame } from "../modal";

import { sheetMaxHeight } from "./sheetModel";
import type { SheetProps } from "./types";

export function Sheet({
  children,
  dismissLabel,
  hideHeader = false,
  initialFocusRef,
  label,
  maxHeight,
  onClose,
  open,
  testID,
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
      // The sheet is named by `label` on both platforms, also when a separate
      // visible `title` is set.
      accessibilityLabel={label}
      // `hideHeader` only drops the close control on web; the modal frame always
      // shows the title. The full headerless sheet is a native affordance. A
      // `dismissLabel` shows as visible text, as in the native header.
      closeText={dismissLabel}
      initialFocusRef={initialFocusRef}
      onClose={onClose}
      placement="bottom-sheet"
      showCloseButton={!hideHeader}
      testID={testID}
      title={title ?? label}
      visible={open}
    >
      {body}
    </WebModalFrame>
  );
}
