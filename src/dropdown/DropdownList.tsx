/** Branded dropdown list rows with shared hover and keyboard state. */
import { Check, IconComponent } from "../primitives/icons";
import { Fragment, ReactNode, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { DEFAULT_DROPDOWN_HIGHLIGHT } from "./dropdownHighlightVariant";
import type { DropdownHighlightVariant } from "./dropdownHighlightVariant";
import {
  createDropdownListStyles,
  dropdownRowHighlight,
} from "./dropdownListStyles";
import type { DropdownListStyles } from "./dropdownListStyles";
import { DropdownGroup } from "./DropdownGroup";
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
  groupSections = false,
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
    isWeb,
    label,
    listId,
    listRole,
    ownedIds: footerEntries.flatMap(
      (entry) => dropdownRowDomId(listId, entry.id) ?? [],
    ),
    required,
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
        <View style={styles.footerEntriesRegion}>
          {footerEntries.map((entry) => renderRow(entry, true))}
        </View>
      ) : null}
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
  onRowRef?: (node: View | null) => void;
  rowDomId?: string;
  styles: DropdownListStyles;
  theme: SharedUiTheme;
}) {
  if (entry.type === "section") {
    return <Text style={styles.section}>{entry.label}</Text>;
  }
  if (entry.type === "divider") {
    return <View style={styles.divider} />;
  }
  const danger = entry.tone === "danger";
  const amber = entry.tone === "amber";
  const highlight = dropdownRowHighlight(styles, theme, highlightVariant, {
    active,
    disabled: Boolean(entry.disabled),
    selected: Boolean(entry.selected),
    tone: entry.tone,
  });
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
  // On web, expose the correct ARIA list-item role (`option`/`menuitem`) via
  // the literal `role` prop, because `option` is missing from the bundled RN
  // `AccessibilityRole` type (RNW forwards `role` at runtime). On native, keep
  // the tappable `button` role so the OS exposes a familiar control. `option`
  // carries `aria-selected`; `menuitem` has no selected state (an action menu).
  // WCAG 4.1.2 Name/Role/Value. The row's name is its label, so the visible
  // secondary line is wired in as its description; otherwise assistive tech
  // would never hear it (WCAG 1.3.1).
  const secondaryId =
    entry.secondary && rowDomId ? `${rowDomId}-secondary` : undefined;
  const webRoleProps: object = isWeb
    ? ({
        "aria-describedby": secondaryId,
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
        disabled: entry.disabled,
        selected: itemRole === "option" ? entry.selected : undefined,
      }}
      disabled={entry.disabled}
      onHoverIn={entry.disabled ? undefined : onHover}
      onPress={entry.onPress}
      ref={onRowRef}
      testID={entry.testID}
      {...webRoleProps}
      style={[
        styles.item,
        entry.type === "footer" ? styles.footer : null,
        highlight.rowStyle,
        entry.disabled ? styles.itemDisabled : null,
      ]}
    >
      {highlight.showDotSlot ? (
        <View style={styles.itemDotSlot}>
          {highlight.showDot ? <View style={styles.itemDot} /> : null}
        </View>
      ) : null}
      {entry.leading ? (
        <View style={styles.leading}>
          {renderRowSlot(entry.leading, highlight.contentColor)}
        </View>
      ) : null}
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, highlight.labelStyle, toneLabel]}>
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text
            nativeID={secondaryId}
            style={[
              [styles.secondary, highlight.secondaryStyle],
              highlight.secondaryLineStyle,
            ]}
          >
            {entry.secondary}
          </Text>
        ) : null}
      </View>
      {entry.right ? (
        <View style={styles.right}>
          {renderRowSlot(entry.right, highlight.contentColor)}
        </View>
      ) : entry.rightText ? (
        <View style={styles.right}>
          <Text style={[styles.rightText, highlight.secondaryStyle]}>
            {entry.rightText}
          </Text>
        </View>
      ) : selectedCheck ? (
        <View style={styles.right}>{selectedCheck}</View>
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

export function DropdownIconBox({
  Icon,
  testID,
  tone = "sage",
}: {
  Icon: IconComponent;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  tone?: "danger" | "sage";
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownListStyles(theme), [theme]);
  const color =
    tone === "danger" ? theme.colors.rose : theme.colors.primaryDeep;
  return (
    <View
      style={[styles.iconBox, tone === "danger" ? styles.iconBoxDanger : null]}
      testID={testID}
    >
      <Icon color={color} size={14} />
    </View>
  );
}
