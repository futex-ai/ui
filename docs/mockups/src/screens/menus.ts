import { Archive, Copy, Link2, Pencil, PinOff } from "lucide-react";

import type { MenuEntry } from "../components/parts/Menu";

/**
 * The actions of a project. A desktop menu opens with its first row active,
 * as the library menus do. A phone sheet has no active row.
 */
export function projectActions(firstActive: boolean): readonly MenuEntry[] {
  return [
    { kind: "item", label: "Rename", icon: Pencil, active: firstActive },
    { kind: "item", label: "Duplicate", icon: Copy },
    { kind: "item", label: "Copy link", icon: Link2 },
    { kind: "item", label: "Unpin", icon: PinOff },
    { kind: "divider" },
    { kind: "item", label: "Archive project", icon: Archive, danger: true },
  ];
}

/** The sort order of the project list: one choice in a group. */
export function sortChoices(currentActive: boolean): readonly MenuEntry[] {
  return [
    { kind: "label", label: "Sort by" },
    {
      kind: "item",
      label: "Recent activity",
      checked: true,
      active: currentActive,
    },
    { kind: "item", label: "Name", checked: false },
    { kind: "item", label: "Status", detail: "Failed first", checked: false },
    { kind: "divider" },
    { kind: "note", text: "Pinned projects stay at the top." },
  ];
}
