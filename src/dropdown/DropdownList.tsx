/** Branded dropdown list rows with shared hover and keyboard state. */
import { LucideIcon } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createDropdownListStyles } from "./dropdownListStyles";
import type { DropdownListStyles } from "./dropdownListStyles";
import {
  dropdownKeyAction,
  navigationResetKey,
  nextSelectableId,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";
import { scrollDropdownActiveRowIntoView } from "./dropdownScroll";

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

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      style={{ maxHeight }}
      {...keyProps}
    >
      {entries.map((entry) => (
        <DropdownRow
          active={entry.id === activeId}
          entry={entry}
          key={entry.id}
          onHover={() => setActiveId(entry.id)}
          onRowRef={setRowRef(entry.id)}
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
  onRowRef,
  styles,
}: {
  active: boolean;
  entry: DropdownListEntry;
  onHover: () => void;
  onRowRef: (node: View | null) => void;
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
      ref={onRowRef}
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
