/**
 * Header chrome: the per-column caret menu (sort / hide / delete) and the
 * add-column (+) field-type picker. Both are `DropdownMenu`s with
 * `highlightVariant="ring"` (the solid fill would invert the row text).
 */
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { Pressable, View } from "react-native";

import { DropdownMenu, type DropdownListEntry } from "../dropdown";
import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { fieldTypeIcon, fieldTypeLabel } from "./dataGridCellContent";
import type { DataGridStyles } from "./dataGridStyles";
import type {
  DataGridColumn,
  DataGridColumnAction,
  DataGridFieldType,
} from "./types";

const ADD_COLUMN_TYPES: DataGridFieldType[] = [
  "text",
  "number",
  "date",
  "singleSelect",
  "multiSelect",
];

/** The caret button + menu for a single column header. */
export function DataGridColumnMenu({
  column,
  onAction,
  styles,
  theme,
  iconSize,
}: {
  column: DataGridColumn;
  onAction: (action: DataGridColumnAction) => void;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  iconSize: number;
}) {
  const entries: DropdownListEntry[] = [];
  if (column.sortable !== false) {
    entries.push({
      id: "sortAsc",
      label: "Sort ascending",
      leading: <ArrowUpAZ color={theme.colors.muted} size={16} />,
      onPress: () => onAction("sortAsc"),
      type: "item",
    });
    entries.push({
      id: "sortDesc",
      label: "Sort descending",
      leading: <ArrowDownAZ color={theme.colors.muted} size={16} />,
      onPress: () => onAction("sortDesc"),
      type: "item",
    });
    if (column.sortDirection) {
      entries.push({
        id: "clearSort",
        label: "Clear sort",
        leading: <X color={theme.colors.muted} size={16} />,
        onPress: () => onAction("clearSort"),
        type: "item",
      });
    }
    entries.push({ id: "sep", label: "", type: "divider" });
  }
  entries.push({
    id: "hide",
    label: "Hide field",
    leading: <EyeOff color={theme.colors.muted} size={16} />,
    onPress: () => onAction("hide"),
    type: "item",
  });
  entries.push({
    id: "delete",
    label: "Delete field",
    leading: <Trash2 color={theme.colors.roseDeep} size={16} />,
    onPress: () => onAction("delete"),
    tone: "danger",
    type: "item",
  });

  return (
    // `DropdownMenu`'s anchor defaults to `alignSelf: flex-start`; center it so
    // the caret sits mid-height in the header cell instead of pinned to the top.
    <DropdownMenu
      accessibilityLabel={`${column.label} field options`}
      entries={entries}
      highlightVariant="ring"
      minWidth={200}
      style={{ alignSelf: "center" }}
    >
      <Pressable
        accessibilityLabel={`${column.label} field options`}
        accessibilityRole="button"
        style={({ hovered }: PressableHoverState) => [
          styles.headerMenuButton,
          hovered ? styles.headerMenuButtonHover : null,
          hideWebOutlineView,
        ]}
      >
        <ChevronDown color={theme.colors.muted} size={iconSize - 1} />
      </Pressable>
    </DropdownMenu>
  );
}

/** The trailing (+) add-column header cell with a field-type picker. */
export function DataGridAddColumn({
  onAddColumn,
  styles,
  theme,
  iconSize,
}: {
  onAddColumn: (fieldType: DataGridFieldType) => void;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  iconSize: number;
}) {
  const entries: DropdownListEntry[] = ADD_COLUMN_TYPES.map((type) => {
    const Icon = fieldTypeIcon(type);
    return {
      id: type,
      label: fieldTypeLabel(type),
      leading: <Icon color={theme.colors.muted} size={16} />,
      onPress: () => onAddColumn(type),
      type: "item",
    };
  });
  // Wrapped in a columnheader (valid grid a11y) that owns the cell dimensions;
  // the centered DropdownMenu keeps the (+) mid-height like the column carets.
  return (
    <View role="columnheader" style={styles.addColumnCell}>
      <DropdownMenu
        accessibilityLabel="Add field"
        entries={entries}
        highlightVariant="ring"
        minWidth={200}
        style={{ alignSelf: "center" }}
      >
        <Pressable
          accessibilityLabel="Add field"
          accessibilityRole="button"
          style={({ hovered }: PressableHoverState) => [
            styles.headerMenuButton,
            hovered ? styles.headerMenuButtonHover : null,
            hideWebOutlineView,
          ]}
        >
          <Plus color={theme.colors.muted} size={iconSize} />
        </Pressable>
      </DropdownMenu>
    </View>
  );
}
