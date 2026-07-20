/**
 * A trigger-backed action menu over the {@link ResponsivePopover} surface: an
 * anchored dialog on web, a bottom sheet on native. It gives the responsive
 * surface the same keyboard behaviour as {@link DropdownMenu} — arrow keys move
 * the active row and Enter selects — without the caller wiring anything.
 *
 * Why it works where a bare `DropdownList` does not: `DropdownList`'s own key
 * handler is bound to its inner `ScrollView`, so it only fires while focus sits
 * inside that scroll node. `ResponsivePopover` moves focus to the dialog surface
 * (an ancestor of the list) on open, so those keydowns bubble straight past the
 * handler and nothing navigates. `useDropdownSelectorNavigation` instead installs
 * a document-level capture keydown listener while open and drives the list
 * through a controlled `activeId`, so navigation is independent of where focus
 * lands — exactly how `DropdownMenu` and `DropdownSelector` already work.
 *
 * On native there is no keyboard: the hook's document listener is inert (there is
 * no `document`) and the sheet's rows are tapped directly.
 */
import { useCallback, useId, useMemo } from "react";
import type { ReactNode, RefObject } from "react";
import type { View } from "react-native";

import {
  DropdownList,
  closeDropdownMenuEntries,
  hasSelectableDropdownMenuEntry,
  useDropdownSelectorNavigation,
} from "../dropdown";
import type { DropdownHighlightVariant, DropdownListEntry } from "../dropdown";

import { ResponsivePopover } from "./ResponsivePopover";

/** State handed to a {@link ResponsiveMenu} `entries` factory. */
export type ResponsiveMenuEntriesState = {
  /** Close the menu (dismisses the dialog on web, the sheet on native). */
  close: () => void;
};

/** Static menu rows or a factory that can close the menu from a row press. */
export type ResponsiveMenuEntries =
  | DropdownListEntry[]
  | ((state: ResponsiveMenuEntriesState) => DropdownListEntry[]);

export type ResponsiveMenuProps = {
  /**
   * Advanced: controlled keyboard-active row id. Omit to let the menu track it
   * internally. Pair with {@link onActiveIdChange} to observe changes.
   */
  activeId?: string | null;
  /** Web horizontal alignment to the anchor. Default `"end"`. */
  align?: "center" | "end" | "start";
  /** Web anchor the menu measures against; ignored on native. */
  anchorRef: RefObject<View | null>;
  /** Close automatically after selectable row presses. Defaults to `true`. */
  closeOnSelect?: boolean;
  /** Native sheet dismiss control label. Default `"Cancel"`. */
  dismissLabel?: string;
  /** Rows rendered in the menu, or a factory given the menu state. */
  entries: ResponsiveMenuEntries;
  /** Content pinned below the scrollable row list. */
  footer?: ReactNode;
  /** Content pinned above the scrollable row list. */
  header?: ReactNode;
  /** Hide the native sheet header row. Default `false`. */
  hideSheetHeader?: boolean;
  /** How the keyboard-focused row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  /** Accessible name for the menu and surface (required); native default title. */
  label: string;
  /** Body cap; the native sheet also clamps to ~70% of the viewport. */
  maxHeight: number;
  /** Web minimum surface width. */
  minWidth?: number;
  /** Notified when the keyboard active row changes. */
  onActiveIdChange?: (id: string | null) => void;
  /** Backdrop / Escape / Android-back / dismiss / row selection. */
  onClose: () => void;
  /** Controlled open state. */
  open: boolean;
  /** Optional search/control slot pinned above the header and rows. */
  search?: ReactNode;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Override the visible native title when it should differ from `label`. */
  title?: string;
  /** Web portal z-index override. */
  zIndex?: number;
};

const noop = () => {};

/**
 * Renders {@link DropdownList} in a {@link ResponsivePopover}, owning the same
 * keyboard machinery as {@link DropdownMenu}. Use `ResponsivePopover` directly
 * when the body is a form rather than a menu — the nested selectors there manage
 * their own keyboard state.
 */
export function ResponsiveMenu({
  activeId,
  align,
  anchorRef,
  closeOnSelect = true,
  dismissLabel,
  entries,
  footer,
  header,
  hideSheetHeader,
  highlightVariant,
  label,
  maxHeight,
  minWidth,
  onActiveIdChange,
  onClose,
  open,
  search,
  testID,
  title,
  zIndex,
}: ResponsiveMenuProps) {
  const listId = useId();
  const rawEntries =
    typeof entries === "function" ? entries({ close: onClose }) : entries;
  const menuEntries = useMemo(
    () => closeDropdownMenuEntries(rawEntries, onClose, closeOnSelect),
    [closeOnSelect, onClose, rawEntries],
  );
  // The document-level listener the hook installs while open drives the active
  // row regardless of focus, so ↑/↓/Enter work despite focus resting on the
  // dialog surface. `onOpen` is unreachable — the body only mounts while open —
  // so it is a no-op.
  const { activeId: navigationActiveId, setActiveId: setNavigationActiveId } =
    useDropdownSelectorNavigation({
      entries: menuEntries,
      interactive: hasSelectableDropdownMenuEntry(menuEntries),
      onClose,
      onOpen: noop,
      open,
      resetOnOpen: true,
      typeahead: Boolean(search),
    });
  const activeRowId = activeId === undefined ? navigationActiveId : activeId;
  const setActiveRowId = useCallback(
    (id: string | null) => {
      setNavigationActiveId(id);
      onActiveIdChange?.(id);
    },
    [onActiveIdChange, setNavigationActiveId],
  );

  return (
    <ResponsivePopover
      align={align}
      anchorRef={anchorRef}
      dismissLabel={dismissLabel}
      hideSheetHeader={hideSheetHeader}
      label={label}
      maxHeight={maxHeight}
      minWidth={minWidth}
      onClose={onClose}
      open={open}
      testID={testID}
      title={title}
      zIndex={zIndex}
    >
      {({ close, maxHeight: bodyMaxHeight }) => (
        <DropdownList
          activeId={activeRowId}
          entries={menuEntries}
          footer={footer}
          header={header}
          highlightVariant={highlightVariant}
          label={label}
          listId={listId}
          listRole="menu"
          maxHeight={bodyMaxHeight}
          onActiveIdChange={setActiveRowId}
          onClose={close}
          search={search}
        />
      )}
    </ResponsivePopover>
  );
}
