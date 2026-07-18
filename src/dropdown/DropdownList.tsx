/** Branded dropdown list rows with shared hover and keyboard state. */
import { Check, LucideIcon } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

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
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
import {
  dropdownKeyAction,
  navigationResetKey,
  nextSelectableId,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";
import { scrollDropdownActiveRowIntoView } from "./dropdownScroll";

export {
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
export type { DropdownHighlightVariant } from "./dropdownListStyles";

/** How the option list and its rows are exposed to assistive tech. */
export type DropdownListRole = "listbox" | "menu";

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
      leading?: ReactNode;
      onPress?: () => void;
      right?: ReactNode;
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
      tone?: "amber" | "danger" | "default" | "muted";
      type: "footer" | "item";
    };

type DropdownListProps = {
  activeId?: string | null;
  entries: DropdownListEntry[];
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

  useEffect(() => {
    scrollDropdownActiveRowIntoView(
      scrollRef.current,
      activeId ? rowRefs.current.get(activeId) : null,
    );
  }, [activeId, navKey]);

  const setRowRef = (id: string) => (node: View | null) => {
    if (node) {
      rowRefs.current.set(id, node);
      return;
    }
    rowRefs.current.delete(id);
  };

  const keyProps = {
    onKeyDown: (event: {
      key?: string;
      nativeEvent?: { key?: string };
      preventDefault?: () => void;
    }) => {
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
      if (!action) return;
      event.preventDefault?.();
      if (action === "close") {
        onClose();
        return;
      }
      if (action === "moveDown" || action === "moveUp") {
        setActiveId(
          nextSelectableId(navItems, activeId, action === "moveDown" ? 1 : -1),
        );
        return;
      }
      if (action === "select" || action === "toggle") {
        const active = entries.find((entry) => entry.id === activeId);
        if (active && "onPress" in active && !active.disabled) {
          active.onPress?.();
        }
      }
    },
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
  const containerA11y: object = isWeb
    ? ({
        "aria-label": label,
        // `aria-required` is allowed on `role="listbox"` but not on `menu`, so
        // only expose it for the listbox container (WCAG 4.1.2).
        ...(required && listRole === "listbox"
          ? { "aria-required": true }
          : {}),
        nativeID: listId,
        role: listRole,
      } as unknown as object)
    : {};

  const hasChrome = Boolean(search) || Boolean(header) || Boolean(footer);
  const scroll = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      style={hasChrome ? styles.scroll : { maxHeight }}
      testID={hasChrome ? undefined : testID}
      {...containerA11y}
      {...keyProps}
    >
      {entries.map((entry) => (
        <DropdownRow
          active={entry.id === activeId}
          entry={entry}
          highlightVariant={highlightVariant}
          isWeb={isWeb}
          itemRole={itemRole}
          key={entry.id}
          onHover={() => setActiveId(entry.id)}
          onRowRef={setRowRef(entry.id)}
          rowDomId={dropdownRowDomId(listId, entry.id)}
          styles={styles}
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
  // WCAG 4.1.2 Name/Role/Value.
  const webRoleProps: object = isWeb
    ? ({
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
        <View style={styles.leading}>{entry.leading}</View>
      ) : null}
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, highlight.labelStyle, toneLabel]}>
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text style={[styles.secondary, highlight.secondaryStyle]}>
            {entry.secondary}
          </Text>
        ) : null}
      </View>
      {entry.right ? (
        <View style={styles.right}>{entry.right}</View>
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

export function DropdownIconBox({
  Icon,
  testID,
  tone = "sage",
}: {
  Icon: LucideIcon;
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
