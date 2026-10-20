/** Branded dropdown list rows with shared hover and keyboard state. */
import { Fragment, ReactNode, useId, useMemo } from "react";
import { Platform, ScrollView, View } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";

import { DEFAULT_DROPDOWN_HIGHLIGHT } from "./dropdownHighlightVariant";
import type { DropdownHighlightVariant } from "./dropdownHighlightVariant";
import { createDropdownListStyles } from "./dropdownListStyles";
import { DropdownGroup } from "./DropdownGroup";
import { DropdownRow } from "./DropdownRow";
import { dropdownListKeepFocusProps } from "./dropdownListKeepFocus";
import {
  dropdownListContainerA11y,
  dropdownListSegments,
  dropdownRowDomId,
} from "./dropdownListModel";
import { useDropdownListNavigation } from "./useDropdownListNavigation";

export {
  dropdownListNavigationItems,
  dropdownRowDomId,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
export type { DropdownHighlightVariant } from "./dropdownHighlightVariant";

/** How the option list and its rows are exposed to assistive tech. */
export type DropdownListRole = "listbox" | "menu";

const NO_ENTRIES: DropdownListEntry[] = [];

/**
 * Content for a row's `leading`/`right` slot: either a plain node the caller
 * owns outright, or a render function handed the row's resolved content color.
 *
 * A plain node is opaque to the library — it cannot be recolored — so an icon
 * hard-coded to `ink` stays near-black on the solid active fill while the label
 * beside it inverts to white. Pass a function instead to tint your own glyph
 * with the row's color, whichever icon set it comes from:
 *
 * ```tsx
 * leading: ({ color }) => <Ionicons color={color} name="settings-outline" size={18} />
 * ```
 */
export type DropdownRowSlot =
  | ReactNode
  | ((state: { color: string }) => ReactNode);

export type DropdownListEntry =
  | { id: string; label: string; type: "divider" }
  | { id: string; label: string; type: "section" }
  | {
      /**
       * Overridable accessible name for the row. Defaults to `label`, so the
       * on-screen text stays the test/automation handle. Set it to disambiguate
       * duplicate labels or pin a locale-stable name without changing the
       * visible copy.
       */
      accessibilityLabel?: string;
      disabled?: boolean;
      id: string;
      label: string;
      /** Leading slot (usually an icon). See {@link DropdownRowSlot}. */
      leading?: DropdownRowSlot;
      onPress?: () => void;
      /** Trailing slot. See {@link DropdownRowSlot}. */
      right?: DropdownRowSlot;
      /**
       * Trailing text (e.g. an account code) rendered in the right slot — the
       * string companion to `right`. Library-styled, so it inverts to white on
       * the solid active fill instead of vanishing as muted grey. Prefer this
       * over a hand-colored `right` node for trailing text; `right` takes
       * precedence and suppresses the selection check when both are set.
       */
      rightText?: string;
      secondary?: string;
      selected?: boolean;
      /** Test identifier forwarded to this row's pressable (`data-testid` on web). */
      testID?: string;
      tone?: "amber" | "danger" | "default" | "muted";
      type: "footer" | "item";
    };

type DropdownListProps = {
  activeId?: string | null;
  entries: DropdownListEntry[];
  /**
   * Whether the list itself is a Tab stop. Defaults to `true`, so a list that
   * scrolls stays reachable from the keyboard; on web the list then points
   * `aria-activedescendant` at the active row. Pass `false` when a combobox
   * input controls the list and keeps focus; on web a pointer press on a row
   * or any other line then leaves focus in the input. Rows are never Tab
   * stops.
   */
  focusable?: boolean;
  footer?: ReactNode;
  /**
   * Selectable rows pinned below the scroll area, so an action such as
   * "Create tag" stays visible while the options scroll. They share the list's
   * keyboard navigation and highlight, and on web the container owns them
   * (`aria-owns`) so they stay part of its listbox or menu.
   */
  footerEntries?: DropdownListEntry[];
  /**
   * Name groups by their section headings. On web, each `section` entry and
   * the rows after it, up to the next section or divider, render inside a
   * `role="group"` labelled by the heading. A heading with no rows after it
   * stays a plain line. Defaults to `false`.
   */
  groupSections?: boolean;
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
   * `aria-activedescendant`. Defaults to an id that the list makes itself, so
   * a list that is its own Tab stop still names its active row.
   */
  listId?: string;
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function DropdownList({
  activeId: controlledActiveId,
  entries,
  focusable = true,
  footer,
  footerEntries = NO_ENTRIES,
  groupSections = false,
  header,
  highlightVariant = DEFAULT_DROPDOWN_HIGHLIGHT,
  label,
  listId: listIdProp,
  listRole = "listbox",
  maxHeight,
  onActiveIdChange,
  onClose,
  required,
  search,
  testID,
}: DropdownListProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownListStyles(theme), [theme]);
  const ownListId = useId();
  const listId = listIdProp ?? ownListId;
  const { activeId, keyProps, scrollRef, setActiveId, setRowRef } =
    useDropdownListNavigation({
      controlledActiveId,
      entries,
      footerEntries,
      maxHeight,
      onActiveIdChange,
      onClose,
    });

  const isWeb = Platform.OS === "web";
  const itemRole: "menuitem" | "option" =
    listRole === "menu" ? "menuitem" : "option";
  const containerA11y = dropdownListContainerA11y({
    activeRowId: dropdownRowDomId(listId, activeId),
    focusable,
    isWeb,
    label,
    listId,
    listRole,
    ownedIds: footerEntries.flatMap(
      (entry) => dropdownRowDomId(listId, entry.id) ?? [],
    ),
    required,
  });
  const keepFocusProps = dropdownListKeepFocusProps({
    inputKeepsFocus: !focusable,
    isWeb,
  });

  // Pinned rows register no scroll ref: they sit outside the scroll area, so
  // moving the active row onto one must not scroll the options.
  const renderRow = (entry: DropdownListEntry, pinned: boolean) => (
    <DropdownRow
      active={entry.id === activeId}
      entry={entry}
      highlightVariant={highlightVariant}
      isWeb={isWeb}
      itemRole={itemRole}
      key={entry.id}
      onHover={() => setActiveId(entry.id)}
      onRowRef={pinned ? undefined : setRowRef(entry.id)}
      rowDomId={dropdownRowDomId(listId, entry.id)}
      styles={styles}
      theme={theme}
    />
  );
  // Groups are a web ARIA structure; native keeps the flat rows.
  const rows =
    isWeb && groupSections
      ? dropdownListSegments(entries, true).map((segment, index) =>
          segment.heading ? (
            <DropdownGroup
              heading={segment.heading}
              key={segment.heading.id}
              listId={listId}
              styles={styles}
            >
              {segment.entries.map((entry) => renderRow(entry, false))}
            </DropdownGroup>
          ) : (
            <Fragment key={`rows-${index}`}>
              {segment.entries.map((entry) => renderRow(entry, false))}
            </Fragment>
          ),
        )
      : entries.map((entry) => renderRow(entry, false));

  const hasChrome =
    Boolean(search) ||
    Boolean(header) ||
    Boolean(footer) ||
    footerEntries.length > 0;
  const scroll = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      style={hasChrome ? styles.scroll : { maxHeight }}
      testID={hasChrome ? undefined : testID}
      {...containerA11y}
      {...keepFocusProps}
      {...keyProps}
    >
      {rows}
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
      {footerEntries.length > 0 ? (
        <View style={styles.footerEntriesRegion} {...keepFocusProps}>
          {footerEntries.map((entry) => renderRow(entry, true))}
        </View>
      ) : null}
      {footer ? <View style={styles.footerRegion}>{footer}</View> : null}
    </View>
  );
}
