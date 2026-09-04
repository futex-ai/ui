/**
 * Header chrome: the per-column caret menu (sort / hide / delete) and the
 * add-column (+) field-type picker. Both are `DropdownMenu`s with
 * `highlightVariant="ring"` (the solid fill would invert the row text).
 */
import { ChevronDown, Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { DropdownMenu, type DropdownListEntry } from "../dropdown";
import { hideWebOutlineView, type PressableHoverState } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import { fieldTypeIcon, fieldTypeLabel } from "./dataGridCellContent";
import { buildMenuEntries } from "./dataGridContextMenu";
import { columnMenuDescriptors } from "./dataGridContextMenuModel";
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
  // The caret menu and the header context menu render from the same
  // descriptors, so the column action vocabulary is defined in one place.
  const entries = buildMenuEntries(columnMenuDescriptors(column), theme, (id) =>
    onAction(id as DataGridColumnAction),
  );

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
