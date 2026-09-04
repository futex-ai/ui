/**
 * What goes in each grid menu, as data.
 *
 * The header caret menu and the three context menus render from these same
 * descriptors, so there is one action vocabulary rather than two that drift.
 * Kept free of JSX and of any `react-native` / `lucide-react-native` runtime
 * import so `node --test` can exercise the gating rules directly; the icons and
 * press handlers are attached in `dataGridContextMenu.tsx`.
 */

/** An icon key resolved to a component by the rendering layer. */
export type DataGridMenuIcon =
  | "clearSort"
  | "copy"
  | "cut"
  | "delete"
  | "duplicate"
  | "edit"
  | "erase"
  | "hide"
  | "insertAbove"
  | "insertBelow"
  | "insertLeft"
  | "insertRight"
  | "paste"
  | "sortAsc"
  | "sortDesc";

export type DataGridMenuDescriptor =
  | { id: string; kind: "divider" }
  | {
      /** Marks the row destructive: rose text and a rose glyph. */
      danger?: boolean;
      icon: DataGridMenuIcon;
      id: string;
      kind: "item";
      label: string;
    };

const divider = (id: string): DataGridMenuDescriptor => ({
  id,
  kind: "divider",
});

/**
 * Drops a trailing divider, and any divider that would lead the menu, so a
 * gated-out block never leaves a stray rule behind.
 */
function tidy(descriptors: DataGridMenuDescriptor[]): DataGridMenuDescriptor[] {
  const out: DataGridMenuDescriptor[] = [];
  for (const descriptor of descriptors) {
    const isDivider = descriptor.kind === "divider";
    const lastIsDivider = out[out.length - 1]?.kind === "divider";
    if (isDivider && (out.length === 0 || lastIsDivider)) {
      continue;
    }
    out.push(descriptor);
  }
  while (out[out.length - 1]?.kind === "divider") {
    out.pop();
  }
  return out;
}

type ColumnMenuOptions = {
  sortDirection?: "asc" | "desc" | null;
  sortable?: boolean;
};

/**
 * Column rows. Sorting is offered unless the column opts out, and "Clear sort"
 * only once the column is actually sorted.
 */
export function columnMenuDescriptors({
  sortDirection,
  sortable,
}: ColumnMenuOptions): DataGridMenuDescriptor[] {
  const descriptors: DataGridMenuDescriptor[] = [];
  if (sortable !== false) {
    descriptors.push(
      {
        icon: "sortAsc",
        id: "sortAsc",
        kind: "item",
        label: "Sort ascending",
      },
      {
        icon: "sortDesc",
        id: "sortDesc",
        kind: "item",
        label: "Sort descending",
      },
    );
    if (sortDirection) {
      descriptors.push({
        icon: "clearSort",
        id: "clearSort",
        kind: "item",
        label: "Clear sort",
      });
    }
    descriptors.push(divider("afterSort"));
  }
  descriptors.push(
    {
      icon: "insertLeft",
      id: "insertLeft",
      kind: "item",
      label: "Insert left",
    },
    {
      icon: "insertRight",
      id: "insertRight",
      kind: "item",
      label: "Insert right",
    },
    { icon: "hide", id: "hide", kind: "item", label: "Hide field" },
    {
      danger: true,
      icon: "delete",
      id: "delete",
      kind: "item",
      label: "Delete field",
    },
  );
  return tidy(descriptors);
}

type RowMenuOptions = {
  /** How many rows the action will apply to; drives the delete row's label. */
  rowCount: number;
  /** Clipboard rows are web-only — the grid reads the OS clipboard. */
  web: boolean;
};

export function rowMenuDescriptors({
  rowCount,
  web,
}: RowMenuOptions): DataGridMenuDescriptor[] {
  const plural = rowCount > 1;
  return tidy([
    {
      icon: "insertAbove",
      id: "insertAbove",
      kind: "item",
      label: "Insert row above",
    },
    {
      icon: "insertBelow",
      id: "insertBelow",
      kind: "item",
      label: "Insert row below",
    },
    {
      icon: "duplicate",
      id: "duplicate",
      kind: "item",
      label: plural ? `Duplicate ${rowCount} rows` : "Duplicate row",
    },
    divider("afterInsert"),
    ...(web
      ? ([{ icon: "copy", id: "copy", kind: "item", label: "Copy" }] as const)
      : []),
    divider("afterCopy"),
    {
      danger: true,
      icon: "delete",
      id: "delete",
      kind: "item",
      label: plural ? `Delete ${rowCount} rows` : "Delete row",
    },
  ]);
}

type CellMenuOptions = {
  /** False for a read-only column: no Edit row and no Clear row. */
  editable: boolean;
  web: boolean;
};

export function cellMenuDescriptors({
  editable,
  web,
}: CellMenuOptions): DataGridMenuDescriptor[] {
  return tidy([
    ...(editable
      ? ([{ icon: "edit", id: "edit", kind: "item", label: "Edit" }] as const)
      : []),
    divider("afterEdit"),
    ...(web
      ? ([
          { icon: "copy", id: "copy", kind: "item", label: "Copy" },
          { icon: "cut", id: "cut", kind: "item", label: "Cut" },
          { icon: "paste", id: "paste", kind: "item", label: "Paste" },
        ] as const)
      : []),
    ...(editable
      ? ([
          { icon: "erase", id: "clear", kind: "item", label: "Clear" },
        ] as const)
      : []),
  ]);
}
