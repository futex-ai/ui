/** Shared data-grid types: field types, columns, rows, cell values, and selection. */

/** The Notion-style field types a grid column can hold. */
export type DataGridFieldType =
  | "text"
  | "number"
  | "date"
  | "singleSelect"
  | "multiSelect";

/**
 * The named color of a select option's pill. Each maps to an AA-contrast
 * background/text pair in {@link resolveOptionColor}; mirrors Notion's palette.
 */
export type DataGridOptionColor =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "purple"
  | "rose"
  | "teal";

/** A single/multi-select option: a stable id, a label, and an optional color. */
export type DataGridSelectOption = {
  /** Stable id stored in the cell value. */
  id: string;
  /** Human-readable label shown in the pill and the editor. */
  label: string;
  /** Pill color. Defaults to `gray`. */
  color?: DataGridOptionColor;
};

/** Horizontal alignment of a column's header and cells. */
export type DataGridColumnAlign = "left" | "center" | "right";

/** A column / field definition. */
export type DataGridColumn = {
  /** Stable id, used as the cell key in {@link DataGridRow.cells}. */
  id: string;
  /** Header label. */
  label: string;
  /** Field type, which selects the cell renderer and editor. */
  fieldType: DataGridFieldType;
  /** Fixed column width in px. Takes precedence over `flex`. */
  width?: number;
  /** Flex grow factor when the column has no fixed `width`. Defaults to 1. */
  flex?: number;
  /** Minimum width in px when sized by `flex`. */
  minWidth?: number;
  /** Header + cell alignment. Defaults per field type (numbers right-align). */
  align?: DataGridColumnAlign;
  /** Hide the column from the grid (kept in the data). */
  hidden?: boolean;
  /** Show the sort actions in the header menu. Defaults to true. */
  sortable?: boolean;
  /** Current sort direction shown in the header, or null when unsorted. */
  sortDirection?: "asc" | "desc" | null;
  /** Allow editing this column's cells. Defaults to true. */
  editable?: boolean;
  /** Options for `singleSelect` / `multiSelect` columns. */
  options?: DataGridSelectOption[];
  /** For `multiSelect`: let the editor create new options from typed text. */
  creatableOptions?: boolean;
};

/**
 * A cell value. Its shape depends on the column's field type:
 * text → string; number → number; date → ISO `YYYY-MM-DD` string;
 * singleSelect → option id; multiSelect → array of option ids; `null` when empty.
 */
export type DataGridCellValue = string | number | string[] | null;

/** A record / row: a stable id and a map of column id → value. */
export type DataGridRow = {
  id: string;
  cells: Record<string, DataGridCellValue>;
};

/** A reference to a single cell by row and column id. */
export type DataGridCellRef = { rowId: string; columnId: string };

/**
 * The current selection as an anchor/focus pair. The selected set is the
 * rectangle between them (see {@link rangeBetween}). Both null means no
 * selection. A single selected cell has `anchor === focus`.
 */
export type DataGridSelection = {
  anchor: DataGridCellRef | null;
  focus: DataGridCellRef | null;
};

/** An action dispatched from a column's header menu. */
export type DataGridColumnAction =
  | "sortAsc"
  | "sortDesc"
  | "clearSort"
  | "hide"
  | "delete";

/** Row heights (px) per control size — fixed so windowing math stays exact. */
export const DATA_GRID_ROW_HEIGHT = { sm: 32, md: 40, lg: 48 } as const;
