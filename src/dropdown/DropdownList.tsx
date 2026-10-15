/** Branded dropdown list rows with shared hover and keyboard state. */
import { Check, Lock } from "../primitives/icons";
import {
  Fragment,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import {
  DEFAULT_DROPDOWN_HIGHLIGHT,
  createDropdownListStyles,
  dropdownRowHighlight,
} from "./dropdownListStyles";
import type {
  DropdownHighlightVariant,
  DropdownListStyles,
} from "./dropdownListStyles";
import {
  dropdownGroupHeadingDomId,
  dropdownListNavigationItems,
  dropdownListSegments,
  dropdownRowDescriptionDomId,
  isInertDropdownListEntry,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
import {
  navigationResetKey,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";
import {
  dropdownGroupA11y,
  dropdownListContainerA11y,
} from "./dropdownListA11y";
import { handleDropdownListKeyDown } from "./dropdownListKeys";
import type { DropdownListKeyEvent } from "./dropdownListKeys";
import { scrollDropdownActiveRowIntoView } from "./dropdownScroll";

export {
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
export type { DropdownHighlightVariant } from "./dropdownListStyles";

/** How the option list and its rows are exposed to assistive tech. */
export type DropdownListRole = "listbox" | "menu";

/** Shared empty default for `footerEntries`, so it keeps a stable identity. */
const NO_ENTRIES: DropdownListEntry[] = [];

/**
 * Stable DOM id for a row so a trigger/input can point `aria-activedescendant`
 * at the active option (WCAG 4.1.2). Returns `undefined` when either part is
 * missing so the attribute is simply omitted rather than dangling.
 */
export function dropdownRowDomId(
  listId: string | undefined,
  rowId: string | null | undefined,
): string | undefined {
  if (!listId || !rowId) {
    return undefined;
  }
  return `${listId}-row-${rowId}`;
}

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
  | {
      /**
       * Group the rows that follow this heading, up to the next section,
       * divider, or the end of the list. On web the heading and its rows render
       * inside a `role="group"` labelled by the heading (`aria-labelledby`), so
       * assistive tech announces the group name with its options; native marks
       * the heading as a header. Defaults to `false`: a plain heading row.
       */
      group?: boolean;
      id: string;
      label: string;
      type: "section";
    }
  | {
      /**
       * Overridable accessible name for the row. Defaults to `label`, so the
       * on-screen text stays the test/automation handle. Set it to disambiguate
       * duplicate labels or pin a locale-stable name without changing the
       * visible copy.
       */
      accessibilityLabel?: string;
      disabled?: boolean;
      /**
       * Keep a `disabled` row in keyboard navigation: arrow keys stop on it so
       * assistive tech announces it, and its `secondary` text (for example why
       * it is unavailable), as disabled. A press, Enter, or hover still never
       * activates it. Defaults to `false`, which skips the row.
       */
      focusableWhenDisabled?: boolean;
      id: string;
      label: string;
      /** Leading slot (usually an icon). See {@link DropdownRowSlot}. */
      leading?: DropdownRowSlot;
      /**
       * A fixed choice, such as a selection that can no longer change. The row
       * keeps its full-strength styling and stays reachable by keyboard, but a
       * press, Enter, or hover never activates it, and it is exposed as
       * disabled (`aria-disabled`). A lock glyph joins the selection check
       * when the trailing slot is free.
       */
      locked?: boolean;
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
  footer?: ReactNode;
  /**
   * Rows pinned under the scrolling rows, outside the scroll area (for example
   * a "Create …" action). They follow the scrolling rows in keyboard order,
   * share their hover and active styling, and stay inside the listbox/menu
   * element so an input's `aria-activedescendant` can point at them.
   */
  footerEntries?: DropdownListEntry[];
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
  footer,
  footerEntries = NO_ENTRIES,
  header,
  highlightVariant = DEFAULT_DROPDOWN_HIGHLIGHT,
  label,
  listId,
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
  const rowRefs = useRef(new Map<string, View>());
  const scrollRef = useRef<ScrollView>(null);
  const allEntries = useMemo(
    () => (footerEntries.length > 0 ? [...entries, ...footerEntries] : entries),
    [entries, footerEntries],
  );
  const navItems = useMemo<DropdownNavigationItem[]>(
    () => dropdownListNavigationItems(allEntries),
    [allEntries],
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
  // beside the anchor, which can hide an active row that was in view. A pinned
  // footer row is always in view, so it never scrolls the rows.
  const activeIsPinned = footerEntries.some((entry) => entry.id === activeId);
  useEffect(() => {
    scrollDropdownActiveRowIntoView(
      scrollRef.current,
      activeId && !activeIsPinned ? rowRefs.current.get(activeId) : null,
    );
  }, [activeId, activeIsPinned, maxHeight, navKey]);

  const setRowRef = (id: string) => (node: View | null) => {
    if (node) {
      rowRefs.current.set(id, node);
      return;
    }
    rowRefs.current.delete(id);
  };

  const keyProps = {
    onKeyDown: (event: DropdownListKeyEvent) =>
      handleDropdownListKeyDown(event, {
        activeId,
        entries: allEntries,
        navItems,
        onClose,
        setActiveId,
      }),
  };

  const isWeb = Platform.OS === "web";
  const itemRole: "menuitem" | "option" =
    listRole === "menu" ? "menuitem" : "option";
  const containerA11y = dropdownListContainerA11y({
    isWeb,
    label,
    listId,
    listRole,
    required,
  });

  const renderRow = (entry: DropdownListEntry) => (
    <DropdownRow
      active={entry.id === activeId}
      entry={entry}
      highlightVariant={highlightVariant}
      isWeb={isWeb}
      itemRole={itemRole}
      key={entry.id}
      onHover={() => setActiveId(entry.id)}
      onRowRef={setRowRef(entry.id)}
      rowDomId={
        entry.type === "section" && entry.group
          ? dropdownGroupHeadingDomId(listId, entry.id)
          : dropdownRowDomId(listId, entry.id)
      }
      styles={styles}
      theme={theme}
    />
  );

  // Pinned rows must sit inside the listbox/menu element, so when there are
  // any, that element wraps the scrolling rows and the pinned region instead
  // of being the scroll view itself.
  const pinned = footerEntries.length > 0;
  const hasChrome =
    Boolean(search) || Boolean(header) || Boolean(footer) || pinned;
  const rows = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      style={hasChrome ? styles.scroll : { maxHeight }}
      testID={hasChrome ? undefined : testID}
      {...(pinned ? null : containerA11y)}
      {...(pinned ? null : keyProps)}
    >
      {dropdownListSegments(entries).map((segment) =>
        segment.heading ? (
          <View
            key={segment.key}
            {...dropdownGroupA11y(
              isWeb,
              dropdownGroupHeadingDomId(listId, segment.heading.id),
            )}
          >
            {renderRow(segment.heading)}
            {segment.rows.map(renderRow)}
          </View>
        ) : (
          <Fragment key={segment.key}>{segment.rows.map(renderRow)}</Fragment>
        ),
      )}
    </ScrollView>
  );
  const scroll = pinned ? (
    <View style={styles.pinnedList} {...containerA11y} {...keyProps}>
      {rows}
      <View style={styles.footerEntriesRegion}>
        {footerEntries.map(renderRow)}
      </View>
    </View>
  ) : (
    rows
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

function DropdownRow({
  active,
  entry,
  highlightVariant,
  isWeb,
  itemRole,
  onHover,
  onRowRef,
  rowDomId,
  styles,
  theme,
}: {
  active: boolean;
  entry: DropdownListEntry;
  highlightVariant: DropdownHighlightVariant;
  isWeb: boolean;
  itemRole: "menuitem" | "option";
  onHover: () => void;
  onRowRef: (node: View | null) => void;
  rowDomId?: string;
  styles: DropdownListStyles;
  theme: SharedUiTheme;
}) {
  if (entry.type === "section") {
    // A grouped heading carries the id its group's `aria-labelledby` points at;
    // native, which has no group role, exposes it as a header instead.
    return (
      <Text
        accessibilityRole={entry.group && !isWeb ? "header" : undefined}
        nativeID={entry.group ? rowDomId : undefined}
        style={styles.section}
      >
        {entry.label}
      </Text>
    );
  }
  if (entry.type === "divider") {
    return <View style={styles.divider} />;
  }
  const danger = entry.tone === "danger";
  const amber = entry.tone === "amber";
  // A locked row, or a disabled row that stays focusable, is reachable by
  // keyboard but never activated, so it never takes the activation fill: while
  // keyboard-active it shows the inset ring over its resting look instead.
  const inert = isInertDropdownListEntry(entry);
  const inactive = Boolean(entry.disabled) || Boolean(entry.locked);
  const highlight = dropdownRowHighlight(styles, theme, highlightVariant, {
    active: active && !inert,
    disabled: Boolean(entry.disabled),
    selected: Boolean(entry.selected),
    tone: entry.tone,
  });
  // A focusable disabled row dims its content rather than the whole row, so
  // the ring keeps its full contrast (WCAG 1.4.11) while the row is active.
  const dimContent = inert && entry.disabled ? styles.itemDisabled : null;
  // The solid active fill carries the tone (a red/amber fill) under an inverted
  // white label, so the tone accent text yields there — the accent would be
  // unreadable on the fill. Off the inverted row the accent colors the label.
  const toneLabel = highlight.invertText
    ? null
    : danger
      ? styles.dangerText
      : amber
        ? styles.amberText
        : null;
  // Selected options are marked with a trailing checkmark so the choice reads
  // independently of which row is keyboard-focused. Only for `option` rows
  // (a `menuitem` has no selected state), and only when the row's trailing slot
  // is free — a custom `right` node or a `rightText` string occupies it instead
  // (e.g. the combobox supplies its own check).
  const selectedCheck =
    itemRole === "option" &&
    highlight.showCheck &&
    !entry.right &&
    !entry.rightText ? (
      <Check color={highlight.checkColor} size={16} strokeWidth={2.5} />
    ) : null;
  const lockGlyph =
    entry.locked && !entry.right && !entry.rightText ? (
      <Lock color={highlight.contentColor} size={14} />
    ) : null;
  // The secondary line is the row's description: an `option`/`menuitem` takes
  // its name from `aria-label`, so without this reference assistive tech never
  // hears the text (for a disabled row, the reason it is unavailable).
  const descriptionId = entry.secondary
    ? dropdownRowDescriptionDomId(rowDomId)
    : undefined;
  // On web, expose the correct ARIA list-item role (`option`/`menuitem`) via
  // the literal `role` prop, because `option` is missing from the bundled RN
  // `AccessibilityRole` type (RNW forwards `role` at runtime). On native, keep
  // the tappable `button` role so the OS exposes a familiar control. `option`
  // carries `aria-selected`; `menuitem` has no selected state (an action menu).
  // WCAG 4.1.2 Name/Role/Value.
  const webRoleProps: object = isWeb
    ? ({
        "aria-describedby": descriptionId,
        nativeID: rowDomId,
        role: itemRole,
        ...(itemRole === "option"
          ? { "aria-selected": Boolean(entry.selected) }
          : {}),
      } as unknown as object)
    : { accessibilityRole: "button" as const };
  return (
    <Pressable
      accessibilityLabel={entry.accessibilityLabel ?? entry.label}
      accessibilityState={{
        disabled: inactive,
        selected: itemRole === "option" ? entry.selected : undefined,
      }}
      disabled={inactive}
      onHoverIn={inactive ? undefined : onHover}
      onPress={entry.onPress}
      ref={onRowRef}
      testID={entry.testID}
      {...webRoleProps}
      style={[
        styles.item,
        entry.type === "footer" ? styles.footer : null,
        highlight.rowStyle,
        inert && active ? styles.itemActiveRing : null,
        entry.disabled && !inert ? styles.itemDisabled : null,
      ]}
    >
      {highlight.showDotSlot ? (
        <View style={styles.itemDotSlot}>
          {highlight.showDot ? <View style={styles.itemDot} /> : null}
        </View>
      ) : null}
      {entry.leading ? (
        <View style={[styles.leading, dimContent]}>
          {renderRowSlot(entry.leading, highlight.contentColor)}
        </View>
      ) : null}
      <View style={[styles.itemText, dimContent]}>
        <Text style={[styles.itemLabel, highlight.labelStyle, toneLabel]}>
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text
            nativeID={descriptionId}
            style={[
              [styles.secondary, highlight.secondaryStyle],
              highlight.descriptionStyle,
            ]}
          >
            {entry.secondary}
          </Text>
        ) : null}
      </View>
      {entry.right ? (
        <View style={[styles.right, dimContent]}>
          {renderRowSlot(entry.right, highlight.contentColor)}
        </View>
      ) : entry.rightText ? (
        <View style={[styles.right, dimContent]}>
          <Text style={[styles.rightText, highlight.secondaryStyle]}>
            {entry.rightText}
          </Text>
        </View>
      ) : lockGlyph ? (
        <View style={[styles.right, styles.rightGlyphs, dimContent]}>
          {lockGlyph}
          {selectedCheck}
        </View>
      ) : selectedCheck ? (
        <View style={[styles.right, dimContent]}>{selectedCheck}</View>
      ) : null}
    </Pressable>
  );
}

/**
 * Resolves a row slot against the row's content color. A plain node passes
 * through untouched (the caller owns its color); a render function receives the
 * color so its glyph tracks the active row's inversion. `ReactNode` excludes
 * functions, so the `typeof` check discriminates the union safely.
 */
function renderRowSlot(slot: DropdownRowSlot, color: string): ReactNode {
  return typeof slot === "function" ? slot({ color }) : slot;
}
