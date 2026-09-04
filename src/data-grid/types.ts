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

/**
 * How a `number` column represents its values.
 *
 * - `number` (default) — a JavaScript number. Fine for counts and scores.
 * - `decimalString` — an exact decimal string such as `"7.500"`. The editor and
 *   the paste path validate the text and hand it back verbatim, never routing
 *   it through `Number`, so arbitrary-precision values (money, ledger amounts)
 *   survive a round-trip digit-for-digit. See {@link parseDecimalString} for
 *   the accepted syntax.
 */
export type DataGridNumberValueMode = "number" | "decimalString";

/** A column / field definition. */
export type DataGridColumn = {
  /** Stable id, used as the cell key in {@link DataGridRow.cells}. */
  id: string;
  /** Header label. */
  label: string;
  /** Field type, which selects the cell renderer and editor. */
  fieldType: DataGridFieldType;
  /**
   * For `number` columns: how values are represented. Defaults to `"number"`.
   * Set `"decimalString"` to keep exact decimal strings — the `#` icon, the
   * right alignment and the typed editor are unchanged, but no value is ever
   * converted through `Number`.
   */
  numberValueMode?: DataGridNumberValueMode;
  /** Fixed column width in px. Takes precedence over `flex`. */
  width?: number;
  /**
   * Flex grow factor when the column has no fixed `width`. Defaults to 1. A
   * flex column's automatic width is capped at a sensible default (so a lone
   * flex column can't stretch across the whole grid); set `maxWidth` to raise
   * or lower that cap.
   */
  flex?: number;
  /** Minimum width in px when sized by `flex` or resized. Defaults to 80. */
  minWidth?: number;
  /**
   * Maximum width in px. Bounds automatic `flex` sizing (overriding the default
   * cap on unbounded flex columns) and caps manual resizing. Manual resizing is
   * otherwise unbounded.
   */
  maxWidth?: number;
  /**
   * Allow resizing the column by dragging its header's right edge (or the arrow
   * keys on the focused edge). Defaults to true; web only.
   */
  resizable?: boolean;
  /** Header + cell alignment. Defaults per field type (numbers right-align). */
  align?: DataGridColumnAlign;
  /** Hide the column from the grid (kept in the data). */
  hidden?: boolean;
  /** Show the sort actions in the header menu. Defaults to true. */
  sortable?: boolean;
  /** Current sort direction shown in the header, or null when unsorted. */
  sortDirection?: "asc" | "desc" | null;
  /**
   * Show a loading spinner in place of the field-type icon in this column's
   * header — e.g. while a just-added column is being provisioned, or its values
   * are being (re)computed / fetched. Purely presentational: the column stays
   * interactive (sortable, resizable, editable). Defaults to false.
   */
  loading?: boolean;
  /** Allow editing this column's cells. Defaults to true. */
  editable?: boolean;
  /** Options for `singleSelect` / `multiSelect` columns. */
  options?: DataGridSelectOption[];
  /** For `multiSelect`: let the editor create new options from typed text. */
  creatableOptions?: boolean;
};

/**
 * A cell value. Its shape depends on the column's field type:
 * text → string; number → number, or an exact decimal string under
 * `numberValueMode: "decimalString"`; date → ISO `YYYY-MM-DD` string;
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

/** An action dispatched from a column's header menu or header context menu. */
export type DataGridColumnAction =
  | "sortAsc"
  | "sortDesc"
  | "clearSort"
  | "hide"
  | "delete"
  | "insertLeft"
  | "insertRight";

/**
 * An action dispatched from a row's context menu. Reported with the row ids it
 * applies to, so a multi-row selection deletes as one operation.
 */
export type DataGridRowAction =
  | "insertAbove"
  | "insertBelow"
  | "duplicate"
  | "delete";

/** The grid region a context menu was opened from. */
export type DataGridContextMenuTarget =
  | { region: "cell"; ref: DataGridCellRef }
  | { region: "column"; columnId: string }
  | { region: "row"; rowId: string };

/** Row heights (px) per control size — fixed so windowing math stays exact. */
export const DATA_GRID_ROW_HEIGHT = { sm: 32, md: 40, lg: 48 } as const;
