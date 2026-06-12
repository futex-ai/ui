/** Branded dropdown list rows with shared hover and keyboard state. */
import { LucideIcon } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";

import {
  dropdownKeyAction,
  DropdownNavigationItem,
  navigationResetKey,
  nextSelectableId,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";

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
  maxHeight: number;
  onActiveIdChange?: (id: string | null) => void;
  onClose: () => void;
};

export function DropdownList({
  activeId: controlledActiveId,
  entries,
  maxHeight,
  onActiveIdChange,
  onClose,
}: DropdownListProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownListStyles(theme), [theme]);
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

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{ maxHeight }}
      {...keyProps}
    >
      {entries.map((entry) => (
        <DropdownRow
          active={entry.id === activeId}
          entry={entry}
          key={entry.id}
          onHover={() => setActiveId(entry.id)}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
}

export function dropdownListNavigationItems(
  entries: DropdownListEntry[],
): DropdownNavigationItem[] {
  return entries.map((entry) => ({
    disabled: "disabled" in entry ? entry.disabled : true,
    id: entry.id,
    selectable: entry.type === "item" || entry.type === "footer",
  }));
}

export function selectedDropdownListEntryId(
  entries: DropdownListEntry[],
): string | null {
  return (
    entries.find((entry) => "selected" in entry && entry.selected)?.id ?? null
  );
}

function DropdownRow({
  active,
  entry,
  onHover,
  styles,
}: {
  active: boolean;
  entry: DropdownListEntry;
  onHover: () => void;
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: entry.disabled,
        selected: entry.selected,
      }}
      disabled={entry.disabled}
      onHoverIn={entry.disabled ? undefined : onHover}
      onPress={entry.onPress}
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

function createDropdownListStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    amberText: { color: theme.colors.amber },
    dangerText: { color: theme.colors.rose },
    divider: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginHorizontal: 6,
      marginVertical: 4,
    },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: 4,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderRadius: theme.radii.md,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    iconBoxDanger: { backgroundColor: theme.colors.roseSoft },
    item: {
      alignItems: "center",
      borderRadius: 7,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    itemActive: { backgroundColor: theme.colors.soft },
    itemDisabled: { opacity: 0.5 },
    itemLabel: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    itemLabelActive: { color: theme.colors.primaryDeep },
    itemSelected: { backgroundColor: theme.colors.primarySoft },
    itemText: { flex: 1, minWidth: 0 },
    leading: { alignItems: "center", justifyContent: "center" },
    right: { alignItems: "center", justifyContent: "center" },
    secondary: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 1,
    },
    section: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: 15,
      paddingBottom: 2,
      paddingHorizontal: 10,
      paddingTop: 6,
      textTransform: "uppercase",
    },
  });
}

type DropdownListStyles = ReturnType<typeof createDropdownListStyles>;
