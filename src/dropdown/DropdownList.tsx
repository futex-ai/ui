/** Branded dropdown list rows with shared hover and keyboard state. */
import { LucideIcon } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createDropdownListStyles } from "./dropdownListStyles";
import type { DropdownListStyles } from "./dropdownListStyles";
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
      disabled?: boolean;
      id: string;
      label: string;
      leading?: ReactNode;
      onPress?: () => void;
      right?: ReactNode;
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
};

export function DropdownList({
  activeId: controlledActiveId,
  entries,
  footer,
  header,
  label,
  listId,
  listRole = "listbox",
  maxHeight,
  onActiveIdChange,
  onClose,
  required,
  search,
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
      {...containerA11y}
      {...keyProps}
    >
      {entries.map((entry) => (
        <DropdownRow
          active={entry.id === activeId}
          entry={entry}
          isWeb={isWeb}
          itemRole={itemRole}
          key={entry.id}
          onHover={() => setActiveId(entry.id)}
          onRowRef={setRowRef(entry.id)}
          rowDomId={dropdownRowDomId(listId, entry.id)}
          styles={styles}
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
    <View style={[styles.chrome, { maxHeight }]}>
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
  isWeb,
  itemRole,
  onHover,
  onRowRef,
  rowDomId,
  styles,
}: {
  active: boolean;
  entry: DropdownListEntry;
  isWeb: boolean;
  itemRole: "menuitem" | "option";
  onHover: () => void;
  onRowRef: (node: View | null) => void;
  rowDomId?: string;
  styles: DropdownListStyles;
}) {
  if (entry.type === "section") {
    return <Text style={styles.section}>{entry.label}</Text>;
  }
  if (entry.type === "divider") {
    return <View style={styles.divider} />;
  }
  const danger = entry.tone === "danger";
  const amber = entry.tone === "amber";
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
        active && !entry.disabled ? styles.itemActive : null,
        entry.selected ? styles.itemSelected : null,
        entry.disabled ? styles.itemDisabled : null,
      ]}
    >
      {entry.leading ? (
        <View style={styles.leading}>{entry.leading}</View>
      ) : null}
      <View style={styles.itemText}>
        <Text
          style={[
            styles.itemLabel,
            active && !entry.disabled ? styles.itemLabelActive : null,
            danger ? styles.dangerText : null,
            amber ? styles.amberText : null,
          ]}
        >
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text style={styles.secondary}>{entry.secondary}</Text>
        ) : null}
      </View>
      {entry.right ? <View style={styles.right}>{entry.right}</View> : null}
    </Pressable>
  );
}

export function DropdownIconBox({
  Icon,
  tone = "sage",
}: {
  Icon: LucideIcon;
  tone?: "danger" | "sage";
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownListStyles(theme), [theme]);
  const color =
    tone === "danger" ? theme.colors.rose : theme.colors.primaryDeep;
  return (
    <View
      style={[styles.iconBox, tone === "danger" ? styles.iconBoxDanger : null]}
    >
      <Icon color={color} size={14} />
    </View>
  );
}
