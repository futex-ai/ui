/** A web context menu: a `DropdownList` positioned at the pointer. */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";

import {
  DropdownList,
  DropdownPortal,
  closeDropdownMenuEntries,
  hasSelectableDropdownMenuEntry,
  useDropdownSelectorNavigation,
} from "../dropdown";

import type { ContextMenuProps } from "./contextMenuModel";

const noop = () => {};

/**
 * Unlike `DropdownMenu`, this menu has no trigger element: it is opened by a
 * gesture somewhere else and positioned at that gesture's point through the
 * portal's virtual `anchorRect`.
 *
 * Two consequences drive the implementation:
 *
 * - A zero-size anchor would resolve to a zero-width surface, because
 *   `dropdownPlacement`'s preferred width defaults to the anchor's width and
 *   `dropdownWidthBounds` treats that width as a minimum. `anchorWidthAsMinimum`
 *   is therefore forced off and `minWidth` is always supplied.
 * - With no trigger to focus, `DropdownList`'s own key handler is unreachable —
 *   it is bound to the list's inner `ScrollView`. `useDropdownSelectorNavigation`
 *   drives a controlled `activeId` from a document-level capture listener
 *   instead, so arrows and Enter work wherever focus happens to be. This is the
 *   same reasoning `ResponsiveMenu` documents.
 */
export function ContextMenu({
  accessibilityLabel,
  entries,
  maxHeight = 320,
  minWidth = 220,
  onClose,
  open,
  point,
  testID,
  zIndex,
}: ContextMenuProps) {
  const contentRef = useRef<View>(null);
  const anchorRect = useMemo(
    () => (point ? { height: 0, width: 0, x: point.x, y: point.y } : null),
    [point],
  );
  const isOpen = open && anchorRect !== null;
  const menuEntries = useMemo(
    () => closeDropdownMenuEntries(entries, onClose, true),
    [entries, onClose],
  );
  const { activeId, setActiveId } = useDropdownSelectorNavigation({
    entries: menuEntries,
    interactive: hasSelectableDropdownMenuEntry(menuEntries),
    onClose,
    onOpen: noop,
    open: isOpen,
    resetOnOpen: true,
  });

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Dismiss on scroll. `useDropdownDismiss` closes on an outside `pointerdown`,
  // which a wheel is not — so without this the menu would stay pinned to a
  // point whose content has moved out from under it. Capture phase because
  // scroll events do not bubble; scrolls inside the menu's own list are ignored
  // so a long menu can still be scrolled.
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }
    const handleScroll = (event: Event) => {
      const node = contentRef.current as unknown as {
        contains?: (other: Node) => boolean;
      } | null;
      const target = event.target;
      if (target instanceof Node && node?.contains?.(target)) {
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const handleActiveIdChange = useCallback(
    (id: string | null) => setActiveId(id),
    [setActiveId],
  );

  return (
    <DropdownPortal
      align="start"
      anchorRect={anchorRect}
      anchorWidthAsMinimum={false}
      gutter={2}
      maxHeight={maxHeight}
      minWidth={minWidth}
      onClose={onClose}
      open={isOpen}
      zIndex={zIndex}
    >
      {(placement) => (
        <View ref={contentRef} testID={testID}>
          <DropdownList
            activeId={activeId}
            entries={menuEntries}
            // The solid active fill would invert library-owned row text to
            // white; the ring keeps the danger row readable as red.
            highlightVariant="ring"
            label={accessibilityLabel}
            listRole="menu"
            maxHeight={placement.maxHeight}
            onActiveIdChange={handleActiveIdChange}
            onClose={onClose}
          />
        </View>
      )}
    </DropdownPortal>
  );
}
