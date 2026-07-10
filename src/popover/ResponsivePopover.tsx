/**
 * Native build of {@link ResponsivePopover}: renders the {@link Sheet} bottom
 * sheet. The web anchor and web-only placement/focus props are ignored here —
 * the sheet is bottom-anchored — so one controlled body works on both
 * platforms, differing only in `layout` (`"sheet"`) and the absent `placement`.
 */
import { Sheet } from "../sheet";

import { resolveResponsivePopoverContent } from "./responsivePopoverModel";
import type { ResponsivePopoverProps } from "./responsivePopoverModel";

export function ResponsivePopover({
  children,
  dismissLabel,
  hideSheetHeader,
  label,
  maxHeight,
  onClose,
  open,
  title,
}: ResponsivePopoverProps) {
  return (
    <Sheet
      dismissLabel={dismissLabel}
      hideHeader={hideSheetHeader}
      label={label}
      maxHeight={maxHeight}
      onClose={onClose}
      open={open}
      title={title}
    >
      {({ close, maxHeight: bodyMaxHeight }) =>
        resolveResponsivePopoverContent(children, {
          close,
          layout: "sheet",
          maxHeight: bodyMaxHeight,
        })
      }
    </Sheet>
  );
}
