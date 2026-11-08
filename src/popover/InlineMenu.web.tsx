/**
 * Web build of {@link InlineMenu}. Outside a touch surface it draws the menu
 * open in place beside its trigger, with no portal and no measurement, so
 * static and server-rendered HTML shows it open. On a touch surface it opens
 * the phone menu sheet.
 *
 * The in-place menu reuses the dropdown pieces: the surface chrome, the
 * document-level outside press and the Escape layer of `useDropdownDismiss`,
 * and `DropdownList` with its keys on the focused list. `PopoverSurface` moves
 * focus to the list on open and back to the trigger on close.
 */
import { useId, useRef } from "react";
import type { RefObject } from "react";
import { StyleSheet, View } from "../primitives/reactNative";
import type { ScrollView } from "../primitives/reactNative";

import {
  DropdownList,
  useDropdownDismiss,
  useDropdownSurfaceStyles,
} from "../dropdown";
import type { DropdownListEntry } from "../dropdown";
import { DROPDOWN_LAYERS } from "../dropdown/dropdownLayers";
import { useTouchSurface } from "../touchSurface";

import { MenuSheet } from "./MenuSheet";
import { PopoverSurface } from "./PopoverSurface";
import {
  inlineMenuPlacementStyle,
  inlineMenuWidthStyle,
  useInlineMenuEntries,
} from "./inlineMenuModel";
import type { InlineMenuProps } from "./inlineMenuModel";

/** Height of the in-place row list before it scrolls, in px. */
const INLINE_MENU_MAX_HEIGHT = 320;

export function InlineMenu({
  children,
  closeOnSelect,
  dismissLabel,
  entries,
  maxHeight,
  onClose,
  open,
  style,
  testID,
  title,
  ...menuProps
}: InlineMenuProps) {
  const touch = useTouchSurface();
  const anchorRef = useRef<View>(null);
  const menuEntries = useInlineMenuEntries(entries, onClose, closeOnSelect);
  return (
    <View
      ref={anchorRef}
      style={[
        styles.anchor,
        // Every view is a stacking context, so the open wrapper lifts itself
        // above the content that follows it.
        open && !touch ? styles.anchorOpen : null,
        style,
      ]}
      testID={testID}
    >
      {children}
      {touch ? (
        <MenuSheet
          activeId={menuProps.activeId}
          dismissLabel={dismissLabel}
          entries={menuEntries}
          highlightVariant={menuProps.highlightVariant}
          label={menuProps.label}
          maxHeight={maxHeight}
          onActiveIdChange={menuProps.onActiveIdChange}
          onClose={onClose}
          open={open}
          size={menuProps.size}
          title={title}
        />
      ) : open ? (
        <InPlaceMenu
          {...menuProps}
          anchorRef={anchorRef}
          entries={menuEntries}
          maxHeight={maxHeight ?? INLINE_MENU_MAX_HEIGHT}
          onClose={onClose}
        />
      ) : null}
    </View>
  );
}

type InPlaceMenuProps = Omit<
  InlineMenuProps,
  | "children"
  | "closeOnSelect"
  | "dismissLabel"
  | "entries"
  | "maxHeight"
  | "open"
  | "style"
  | "testID"
  | "title"
> & {
  anchorRef: RefObject<View | null>;
  entries: DropdownListEntry[];
  maxHeight: number;
};

/** The open menu surface, mounted only while the menu is open. */
function InPlaceMenu({
  activeId,
  align = "start",
  anchorRef,
  entries,
  highlightVariant,
  label,
  maxHeight,
  maxWidth,
  minWidth,
  onActiveIdChange,
  onClose,
  side = "below",
  size,
  surfaceStyle,
  width,
}: InPlaceMenuProps) {
  const surfaceRef = useRef<View>(null);
  const listRef = useRef<ScrollView>(null);
  // Opening focuses the list, which then holds the keys of the menu.
  const focusListRef = useRef({
    focus: () => {
      const node: unknown = listRef.current;
      if (isFocusable(node)) node.focus();
    },
  });
  const listId = useId();
  const surfaceStyles = useDropdownSurfaceStyles();
  useDropdownDismiss({ anchorRef, onClose, open: true, surfaceRef });
  return (
    <View
      ref={surfaceRef}
      style={[
        surfaceStyles.surface,
        size === "xs" ? styles.denseSurface : null,
        inlineMenuPlacementStyle(side, align),
        inlineMenuWidthStyle({ maxWidth, minWidth, width }),
        surfaceStyle,
      ]}
    >
      <PopoverSurface initialFocusRef={focusListRef}>
        <DropdownList
          activeId={activeId}
          entries={entries}
          focusMode="list"
          highlightVariant={highlightVariant}
          label={label}
          listId={listId}
          listRef={listRef}
          listRole="menu"
          maxHeight={maxHeight}
          onActiveIdChange={onActiveIdChange}
          onClose={onClose}
          size={size}
        />
      </PopoverSurface>
    </View>
  );
}

/** Whether a host node can take focus: a DOM element can, a native view cannot. */
function isFocusable(value: unknown): value is { focus: () => void } {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function"
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
  anchorOpen: { zIndex: DROPDOWN_LAYERS.portal },
  // The dense menu has a 4px inset, as its 26px rows do.
  denseSurface: { padding: 4 },
});
