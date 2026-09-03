/**
 * Owns the grid's single context menu: which target it was opened for, where,
 * and what it contains.
 *
 * One menu instance and one stable `onContextMenu` callback for the whole grid.
 * A menu per cell would mount hundreds of portals in a virtualized body and
 * give each its own open state; a per-row closure would defeat `DataGridRow`'s
 * `memo` on every render.
 *
 * Entries are resolved once, when the menu opens, and held in state — a context
 * menu should act on the selection as it was at the moment of the gesture. That
 * also lets `open` be a plain `state !== null`, which the controller needs
 * *before* this hook can see it: the grid calls `bind()` afterwards with the
 * controller and callbacks, the same late-binding shape `useDataGridClipboard`
 * already uses for the same reason.
 */
import { useCallback, useRef, useState } from "react";

import type { DropdownListEntry, DropdownPoint } from "../dropdown";
import type { SharedUiTheme } from "../theme";

import { buildMenuEntries } from "./dataGridContextMenu";
import {
  cellMenuDescriptors,
  columnMenuDescriptors,
  rowMenuDescriptors,
} from "./dataGridContextMenuModel";
import { contextRowIds, contextSelectionFor } from "./dataGridContextSelection";
import type { DataGridRangeRect } from "./dataGridSelectionModel";
import type { DataGridController } from "./useDataGridController";
import type {
  DataGridCellRef,
  DataGridColumn,
  DataGridColumnAction,
  DataGridContextMenuTarget,
  DataGridRowAction,
  DataGridSelection,
} from "./types";

/** The context handed to a consumer's `onContextMenuEntries`. */
export type DataGridContextMenuContext =
  | { region: "cell"; ref: DataGridCellRef; rect: DataGridRangeRect | null }
  | { region: "column"; column: DataGridColumn }
  | { region: "row"; rowIds: string[] };

export type DataGridContextMenuEntries = (
  entries: DropdownListEntry[],
  context: DataGridContextMenuContext,
) => DropdownListEntry[];

type ContextMenuBindings = {
  columns: DataGridColumn[];
  controller: DataGridController;
  onCellChange: boolean;
  onClearSelection: () => void;
  onColumnMenuAction?: (columnId: string, action: DataGridColumnAction) => void;
  onContextMenuEntries?: DataGridContextMenuEntries;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onRowMenuAction?: (rowIds: string[], action: DataGridRowAction) => void;
};

type OpenMenu = {
  entries: DropdownListEntry[];
  label: string;
  point: DropdownPoint | null;
  title?: string;
};

export function useDataGridContextMenu({
  theme,
  web,
}: {
  theme: SharedUiTheme;
  web: boolean;
}) {
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const depsRef = useRef<ContextMenuBindings | null>(null);

  const bind = useCallback((bindings: ContextMenuBindings) => {
    depsRef.current = bindings;
  }, []);

  const close = useCallback(() => setMenu(null), []);

  const resolve = useCallback(
    (
      target: DataGridContextMenuTarget,
      /**
       * The selection as it will be once this gesture is applied. Passed in
       * rather than read off the controller: `setSelection` has not
       * re-rendered yet at this point, so the controller still holds the
       * pre-gesture selection and a collapsed row menu would be counted
       * against the old span.
       */
      selection: DataGridSelection,
    ): OpenMenu | null => {
      const deps = depsRef.current;
      if (!deps) {
        return null;
      }
      const {
        columns,
        controller,
        onCellChange,
        onClearSelection,
        onColumnMenuAction,
        onContextMenuEntries,
        onCopy,
        onCut,
        onPaste,
        onRowMenuAction,
      } = deps;
      const { columnIds, rowIds } = controller;

      if (target.region === "column") {
        const column = columns.find(
          (candidate) => candidate.id === target.columnId,
        );
        if (!column || !onColumnMenuAction) {
          return null;
        }
        const entries = buildMenuEntries(
          columnMenuDescriptors(column),
          theme,
          (id) => onColumnMenuAction(column.id, id as DataGridColumnAction),
        );
        return {
          entries: onContextMenuEntries
            ? onContextMenuEntries(entries, { column, region: "column" })
            : entries,
          label: `${column.label} field options`,
          point: null,
          title: column.label,
        };
      }

      if (target.region === "row") {
        if (!onRowMenuAction) {
          return null;
        }
        const targetRowIds = contextRowIds({
          columnIds,
          rowId: target.rowId,
          rowIds,
          selection,
        });
        const entries = buildMenuEntries(
          rowMenuDescriptors({ rowCount: targetRowIds.length, web }),
          theme,
          (id) => {
            if (id === "copy") {
              onCopy();
              return;
            }
            onRowMenuAction(targetRowIds, id as DataGridRowAction);
          },
        );
        const label =
          targetRowIds.length > 1
            ? `${targetRowIds.length} rows selected`
            : `Row ${rowIds.indexOf(target.rowId) + 1} options`;
        return {
          entries: onContextMenuEntries
            ? onContextMenuEntries(entries, {
                region: "row",
                rowIds: targetRowIds,
              })
            : entries,
          label,
          point: null,
          title: label,
        };
      }

      const column = columns.find(
        (candidate) => candidate.id === target.ref.columnId,
      );
      // Editing needs a writable column and a consumer that accepts writes.
      const editable = Boolean(
        column && column.editable !== false && onCellChange,
      );
      const entries = buildMenuEntries(
        cellMenuDescriptors({ editable, web }),
        theme,
        (id) => {
          if (id === "edit") {
            controller.requestEdit(target.ref);
          } else if (id === "copy") {
            onCopy();
          } else if (id === "cut") {
            onCut();
          } else if (id === "paste") {
            onPaste();
          } else if (id === "clear") {
            onClearSelection();
          }
        },
      );
      return {
        entries: onContextMenuEntries
          ? onContextMenuEntries(entries, {
              rect: controller.rect,
              ref: target.ref,
              region: "cell",
            })
          : entries,
        label: column ? `${column.label} cell options` : "Cell options",
        point: null,
        title: column?.label,
      };
    },
    [theme, web],
  );

  const onContextMenu = useCallback(
    (target: DataGridContextMenuTarget, point: DropdownPoint | null) => {
      const deps = depsRef.current;
      // On web the menu is positioned at the gesture, so a coordinate-less
      // event has nowhere to go. Native opens a sheet, which needs no point.
      if (!deps || (web && !point)) {
        return;
      }
      const { controller } = deps;
      const { columnIds, rowIds, selection } = controller;
      const ref =
        target.region === "cell"
          ? target.ref
          : target.region === "row"
            ? { rowId: target.rowId, columnId: columnIds[0] ?? "" }
            : { rowId: rowIds[0] ?? "", columnId: target.columnId };

      // Spreadsheet rule: keep a selection the gesture landed inside, collapse
      // to the target otherwise. Applied before resolving entries so a row menu
      // opened inside a five-row selection says "Delete 5 rows".
      const nextSelection = contextSelectionFor({
        columnIds,
        ref,
        region: target.region,
        rowIds,
        selection,
      });
      if (nextSelection) {
        controller.setSelection(nextSelection);
      }
      const resolved = resolve(target, nextSelection ?? selection);
      // A region with every row gated out — or a consumer returning `[]` to
      // suppress it — must not flash an empty surface or gate the keyboard.
      if (!resolved || resolved.entries.length === 0) {
        return;
      }
      setMenu({ ...resolved, point });
    },
    [resolve, web],
  );

  /** Shift+F10 / the ContextMenu key: open the cell menu under the focused cell. */
  const onContextMenuKey = useCallback(
    (ref: DataGridCellRef) => {
      const deps = depsRef.current;
      if (!deps) {
        return;
      }
      onContextMenu(
        { ref, region: "cell" },
        deps.controller.contextMenuPointForCell(ref),
      );
    },
    [onContextMenu],
  );

  return {
    bind,
    close,
    entries: menu?.entries ?? [],
    label: menu?.label ?? "Menu",
    onContextMenu,
    onContextMenuKey,
    open: menu !== null,
    point: menu?.point ?? null,
    title: menu?.title,
  };
}
