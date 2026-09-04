/**
 * Turns the pure menu descriptors into `DropdownList` entries: an icon per row,
 * the rose treatment for destructive rows, and a press handler that reports the
 * descriptor's id back as an action.
 */
import {
  ArrowDownAZ,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpAZ,
  ArrowUpToLine,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Eraser,
  EyeOff,
  Pencil,
  Scissors,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react-native";

import type { DropdownListEntry } from "../dropdown";
import type { SharedUiTheme } from "../theme";

import type {
  DataGridMenuDescriptor,
  DataGridMenuIcon,
} from "./dataGridContextMenuModel";

const MENU_ICONS: Record<DataGridMenuIcon, LucideIcon> = {
  clearSort: X,
  copy: Copy,
  cut: Scissors,
  delete: Trash2,
  duplicate: CopyPlus,
  edit: Pencil,
  erase: Eraser,
  hide: EyeOff,
  insertAbove: ArrowUpToLine,
  insertBelow: ArrowDownToLine,
  insertLeft: ArrowLeftToLine,
  insertRight: ArrowRightToLine,
  paste: ClipboardPaste,
  sortAsc: ArrowUpAZ,
  sortDesc: ArrowDownAZ,
};

/**
 * `onAction` receives the descriptor's `id`. Callers narrow it to their own
 * action union (`DataGridColumnAction`, `DataGridRowAction`, or the cell menu's
 * internal ids), which is safe because the descriptor ids are authored
 * alongside those unions in `dataGridContextMenuModel.ts`.
 */
export function buildMenuEntries(
  descriptors: DataGridMenuDescriptor[],
  theme: SharedUiTheme,
  onAction: (id: string) => void,
): DropdownListEntry[] {
  return descriptors.map((descriptor) => {
    if (descriptor.kind === "divider") {
      return { id: descriptor.id, label: "", type: "divider" };
    }
    const Icon = MENU_ICONS[descriptor.icon];
    return {
      id: descriptor.id,
      label: descriptor.label,
      leading: (
        <Icon
          color={descriptor.danger ? theme.colors.roseDeep : theme.colors.muted}
          size={16}
        />
      ),
      onPress: () => onAction(descriptor.id),
      ...(descriptor.danger ? { tone: "danger" as const } : {}),
      type: "item",
    };
  });
}
