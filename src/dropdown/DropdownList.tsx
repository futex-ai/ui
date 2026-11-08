/** Branded dropdown list rows with shared hover and keyboard state. */
import {
  ReactNode,
  RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, ScrollView, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";
import { useTouchSurface } from "../touchSurface";

import { DropdownRow } from "./DropdownRow";
import { DEFAULT_DROPDOWN_HIGHLIGHT } from "./dropdownListStyles";
import type { DropdownHighlightVariant } from "./dropdownListStyles";
import { useDropdownListKeyboard } from "./dropdownListKeyboard";
import type { DropdownListFocusMode } from "./dropdownListKeyboard";
import {
  dropdownListNavigationItems,
  dropdownRowDomId,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
import {
  navigationResetKey,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";
import { createDropdownRowStyles } from "./dropdownRowSizing";
import type { DropdownListEntry, DropdownListRole } from "./dropdownListTypes";
import { scrollDropdownActiveRowIntoView } from "./dropdownScroll";

export {
  dropdownListNavigationItems,
  dropdownRowDomId,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
export type { DropdownHighlightVariant } from "./dropdownListStyles";
export type { DropdownListFocusMode } from "./dropdownListKeyboard";
export type {
  DropdownListEntry,
  DropdownListRole,
  DropdownRowSlot,
} from "./dropdownListTypes";

type DropdownListProps = {
  activeId?: string | null;
  entries: DropdownListEntry[];
  /**
   * Where keyboard focus sits. `rows` (default) keeps each row its own tab
   * stop. `list` makes the list one tab stop that points at the active row
   * and handles the arrow keys, Enter, and Space itself, as an open menu does.
   */
  focusMode?: DropdownListFocusMode;
  footer?: ReactNode;
  header?: ReactNode;
  /**
   * How focused/selected rows are highlighted. Defaults to `"solid"`. See
   * {@link DropdownHighlightVariant}.
   */
  highlightVariant?: DropdownHighlightVariant;
  /** Accessible name for the option container (WCAG 4.1.2). */
  label?: string;
  /**
   * Stable `nativeID` for the list container. Used both as the `aria-controls`
   * target on the trigger/input and as the prefix for per-row ids that back
   * `aria-activedescendant`.
   */
  listId?: string;
  /** The scrolling list node, for example to focus it in `list` focus mode. */
  listRef?: RefObject<ScrollView | null>;
  /** Container/row roles: `listbox`/`option` (default) or `menu`/`menuitem`. */
  listRole?: DropdownListRole;
  maxHeight: number;
  onActiveIdChange?: (id: string | null) => void;
  onClose: () => void;
  /**
   * Marks the option container as a required field (`aria-required`). Valid on
   * `role="listbox"` — unlike on a `role="button"` trigger — so a required
   * selector exposes its required state here (WCAG 4.1.2).
   */
  required?: boolean;
  search?: ReactNode;
  /**
   * Row size. `xs` draws 26px dense rows; every other size and no size draw
   * the standard rows. Inside a `TouchSurface` the rows take the touch
   * metrics, 44px for one line, whatever the size.
   */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function DropdownList({
  activeId: controlledActiveId,
  entries,
  focusMode = "rows",
  footer,
  header,
  highlightVariant = DEFAULT_DROPDOWN_HIGHLIGHT,
  label,
  listId: callerListId,
  listRef,
  listRole = "listbox",
  maxHeight,
  onActiveIdChange,
  onClose,
  required,
  search,
  size,
  testID,
}: DropdownListProps) {
  const theme = useSharedUiTheme();
  const touch = useTouchSurface();
  // A focused list points at its active row by id, so `list` focus mode needs
  // row ids even when the caller gives no list id. The rows mode keeps its
  // markup: without a caller id, its rows stay without ids.
  const generatedListId = useId();
  const listId =
    callerListId ?? (focusMode === "list" ? generatedListId : undefined);
  const rowStyles = useMemo(
    () => createDropdownRowStyles(theme, size, touch),
    [theme, size, touch],
  );
  const styles = rowStyles.styles;
  const rowRefs = useRef(new Map<string, View>());
  const ownScrollRef = useRef<ScrollView>(null);
  const scrollRef = listRef ?? ownScrollRef;
  const navItems = useMemo<DropdownNavigationItem[]>(
    () => dropdownListNavigationItems(entries),
    [entries],
  );
  const navKey = navigationResetKey(navItems);
  const selectedId = selectedDropdownListEntryId(entries);
  const [uncontrolledActiveId, setUncontrolledActiveId] = useState<
    string | null
  >(selectedOrFirstId(navItems, selectedId));
  const activeId =
    controlledActiveId === undefined
      ? uncontrolledActiveId
      : controlledActiveId;
  const setActiveId = (id: string | null) => {
    if (controlledActiveId === undefined) {
      setUncontrolledActiveId(id);
    }
    onActiveIdChange?.(id);
  };

  useEffect(() => {
    if (shouldResetDropdownListActiveId(controlledActiveId)) {
      setUncontrolledActiveId(selectedOrFirstId(navItems, selectedId));
    }
  }, [controlledActiveId, navKey, selectedId]);

  // Also re-run when the list's height changes: a web portal lays the list out
  // once at its natural height to measure it, then clamps it to the room
  // beside the anchor, which can hide an active row that was in view.
  useEffect(() => {
    scrollDropdownActiveRowIntoView(
      scrollRef.current,
      activeId ? rowRefs.current.get(activeId) : null,
    );
  }, [activeId, maxHeight, navKey]);

  const setRowRef = (id: string) => (node: View | null) => {
    if (node) {
      rowRefs.current.set(id, node);
      return;
    }
    rowRefs.current.delete(id);
  };

  // `listbox`/`menu` (and `option`/`menuitem`) are web ARIA roles; gate them to
  // web so native list semantics are not regressed (the rows stay tappable
  // Pressables on native). WCAG 4.1.2 Name/Role/Value. They are passed via the
  // literal `role` prop because `listbox`/`option` are absent from the bundled
  // React Native `AccessibilityRole`/`Role` types (RNW forwards them at
  // runtime); the cast is scoped to this web-only props object.
  const isWeb = Platform.OS === "web";
  const itemRole: "menuitem" | "option" =
    listRole === "menu" ? "menuitem" : "option";
  const listFocus = focusMode === "list";
  const focus = useDropdownListKeyboard({
    activeId,
    entries,
    focusMode,
    listId,
    navItems,
    onClose,
    setActiveId,
  });
  const containerA11y: object = isWeb
    ? ({
        "aria-label": label,
        // `aria-required` is allowed on `role="listbox"` but not on `menu`, so
        // only expose it for the listbox container (WCAG 4.1.2).
        ...(required && listRole === "listbox"
          ? { "aria-required": true }
          : {}),
        ...focus.containerProps,
        nativeID: listId,
        role: listRole,
      } as unknown as object)
    : {};

  const hasChrome = Boolean(search) || Boolean(header) || Boolean(footer);
  const scroll = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      style={[hasChrome ? styles.scroll : { maxHeight }, focus.containerStyle]}
      testID={hasChrome ? undefined : testID}
      {...containerA11y}
      {...focus.keyProps}
    >
      {entries.map((entry) => (
        <DropdownRow
          active={entry.id === activeId}
          entry={entry}
          highlightVariant={highlightVariant}
          isWeb={isWeb}
          itemRole={itemRole}
          key={entry.id}
          listFocus={listFocus}
          noteDomId={focus.noteDomId(entry.id)}
          onHover={() => setActiveId(entry.id)}
          onRowRef={setRowRef(entry.id)}
          rowDomId={dropdownRowDomId(listId, entry.id)}
          rowStyles={rowStyles}
          theme={theme}
        />
      ))}
    </ScrollView>
  );

  // Search, header, and footer content pin outside the scroll area so they
  // stay visible while the option rows scroll between them. The wrapper shrinks
  // to the surface's content box (which is inset by the surface padding) so the
  // pinned footer is not clipped past the bottom edge.
  if (!hasChrome) {
    return scroll;
  }
  return (
    <View style={[styles.chrome, { maxHeight }]} testID={testID}>
      {search ? <View style={styles.searchRegion}>{search}</View> : null}
      {header ? <View style={styles.headerRegion}>{header}</View> : null}
      {scroll}
      {footer ? <View style={styles.footerRegion}>{footer}</View> : null}
    </View>
  );
}
