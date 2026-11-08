import { Archive, Copy, Link2, Pencil, PinOff } from "lucide-react";
import type { DropdownListEntry } from "@firna/ui/dropdown";

import { noop } from "../noop";

/** The actions of a project: icons, a divider, and a danger row. */
export const projectActions: DropdownListEntry[] = [
  { icon: Pencil, id: "rename", label: "Rename", onPress: noop, type: "item" },
  {
    icon: Copy,
    id: "duplicate",
    label: "Duplicate",
    onPress: noop,
    type: "item",
  },
  {
    icon: Link2,
    id: "copy-link",
    label: "Copy link",
    onPress: noop,
    type: "item",
  },
  { icon: PinOff, id: "unpin", label: "Unpin", onPress: noop, type: "item" },
  { id: "actions-divider", label: "", type: "divider" },
  {
    icon: Archive,
    id: "archive",
    label: "Archive project",
    onPress: noop,
    tone: "danger",
    type: "item",
  },
];

/**
 * The row that a desktop menu draws active: its first row, as the library
 * menus open. A phone sheet opens with no active row.
 */
export const firstProjectAction = "rename";

/** The sort order of the project list: one checked choice in a group. */
export const sortChoices: DropdownListEntry[] = [
  { id: "sort-by", label: "Sort by", type: "section" },
  {
    checked: true,
    id: "recent",
    label: "Recent activity",
    onPress: noop,
    type: "item",
  },
  { checked: false, id: "name", label: "Name", onPress: noop, type: "item" },
  {
    checked: false,
    id: "status",
    label: "Status",
    onPress: noop,
    rightText: "Failed first",
    type: "item",
  },
  { id: "sort-divider", label: "", type: "divider" },
  { id: "sort-note", label: "Pinned projects stay at the top.", type: "note" },
];

/** The current choice, which the desktop menu opens on. */
export const currentSortChoice = "recent";
