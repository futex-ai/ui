/** A native context menu: the same entries as a bottom sheet. */
import { useRef } from "react";
import { View } from "react-native";

import type { ContextMenuProps } from "./contextMenuModel";
import { ResponsiveMenu } from "./ResponsiveMenu";

/**
 * Native has no pointer to anchor to and no room for a floating surface under a
 * thumb, so a long-press opens the house bottom sheet instead of a positioned
 * menu. `ResponsivePopover` (which `ResponsiveMenu` renders into) ignores
 * `anchorRef` entirely on native, so the ref below is never measured and
 * `point` is unused — the web build in `ContextMenu.web.tsx` is what consumes
 * it.
 */
export function ContextMenu({
  accessibilityLabel,
  entries,
  maxHeight = 320,
  onClose,
  open,
  testID,
  title,
  zIndex,
}: ContextMenuProps) {
  const anchorRef = useRef<View>(null);
  return (
    <ResponsiveMenu
      anchorRef={anchorRef}
      entries={entries}
      highlightVariant="ring"
      label={accessibilityLabel}
      maxHeight={maxHeight}
      onClose={onClose}
      open={open}
      testID={testID}
      title={title}
      zIndex={zIndex}
    />
  );
}
