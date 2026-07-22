import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  DataGrid,
  dataGridSelectionModel,
  useSharedUiTheme,
  type DataGridCellRef,
  type DataGridCellValue,
  type DataGridColumn,
  type DataGridRow,
  type DataGridSelection,
} from "../index";
import { StorySurface } from "./sharedExamples";
import {
  contentColumns,
  contentRows,
  makeManyRows,
} from "./dataGridSampleData";

const meta = {
  title: "DataGrid/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: "Basic",
  render: () => (
    <StorySurface>
      <View style={styles.frame}>
        <DataGrid
          accessibilityLabel="Content"
          columns={contentColumns}
          footerText="7 of 128 records · 0 filters · sorted by Created"
          rows={contentRows}
        />
      </View>
    </StorySurface>
  ),
};

// A deliberately sparse table (like a fresh two-field board): with only a
// couple of columns, the flexible Title column would otherwise stretch across
// the whole grid. It is capped at a sensible default width instead.
const sparseColumns: DataGridColumn[] = [
  { id: "title", label: "Title", fieldType: "text" },
  {
    id: "status",
    label: "Status",
    fieldType: "singleSelect",
    width: 130,
    options: [
      { id: "todo", label: "Todo", color: "amber" },
      { id: "done", label: "Done", color: "green" },
    ],
  },
];

const sparseRows: DataGridRow[] = [
  { id: "s1", cells: { title: "Hello World", status: "todo" } },
  { id: "s2", cells: { title: "Coordinate this workspace", status: "todo" } },
  {
    id: "s3",
    cells: { title: "Ship the sparse-grid width fix", status: "done" },
  },
];

export const FewColumns: Story = {
  name: "Few columns (capped width)",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <View style={styles.frameWide}>
          <DataGrid
            accessibilityLabel="Tasks"
            columns={sparseColumns}
            rows={sparseRows}
          />
        </View>
        <Text style={styles.hint}>
          With only a couple of columns, the flexible Title column is capped at
          a default max width instead of ballooning across the whole grid; the
          leftover space reads as a clean empty area. Drag the Title header's
          right edge to widen it past the cap.
        </Text>
      </View>
    </StorySurface>
  ),
};

// Corners are square by default (see `Basic`). Pass `borderRadius` — here the
// shared `radii.lg` token — to round the frame + mobile cards.
function RoundedExample() {
  const theme = useSharedUiTheme();
  return (
    <StorySurface>
      <View style={styles.frame}>
        <DataGrid
          accessibilityLabel="Content"
          borderRadius={theme.radii.lg}
          columns={contentColumns}
          footerText="7 of 128 records · 0 filters · sorted by Created"
          rows={contentRows}
        />
      </View>
    </StorySurface>
  );
}

export const Rounded: Story = {
  name: "Rounded corners (borderRadius)",
  render: () => <RoundedExample />,
};

export const Borderless: Story = {
  name: "Borderless (borderWidth 0)",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {/* No outer frame at all — the header fill + internal cell hairlines
            carry the structure. Drop the border to sit flush inside your own
            bordered/padded container. */}
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            borderWidth={0}
            columns={contentColumns}
            footerText="7 of 128 records · 0 filters · sorted by Created"
            rows={contentRows}
          />
        </View>
        <Text style={styles.hint}>
          `borderWidth={0}` removes the outer frame entirely; the internal cell
          separators are unaffected.
        </Text>
      </View>
    </StorySurface>
  ),
};

export const FixedHeight: Story = {
  name: "Fixed height (empty area below rows)",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {/* A bounded body (`maxHeight`) taller than its rows keeps the height:
            the rows stack at the top and the area below the last row reads as a
            muted grey empty zone rather than collapsing to the rows or leaving a
            blank white gap — the fixed-height-container case (e.g. a full-page
            table with only a handful of records). */}
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={contentColumns}
            footerText="2 of 128 records"
            maxHeight={420}
            onAddRow={() => undefined}
            rows={contentRows.slice(0, 2)}
          />
        </View>
        <Text style={styles.hint}>
          `maxHeight` sets a fixed body height; with fewer rows than fit, the
          space below the last row is a quiet grey empty zone.
        </Text>
      </View>
    </StorySurface>
  ),
};

const rowIds = contentRows.map((row) => row.id);
const columnIds = contentColumns.map((column) => column.id);

function SelectionExample() {
  const [selection, setSelection] = useState<DataGridSelection>({
    anchor: null,
    focus: null,
  });
  const count = dataGridSelectionModel.selectionCount(
    selection,
    rowIds,
    columnIds,
  );
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status} testID="selection-status">
          {count} cell{count === 1 ? "" : "s"} selected
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={contentColumns}
            onSelectionChange={setSelection}
            rows={contentRows}
            selection={selection}
          />
        </View>
        <Text style={styles.hint}>
          Click a cell, then use the arrow keys to move. Hold Shift to extend
          the selection; press Ctrl/Cmd+A to select all.
        </Text>
      </View>
    </StorySurface>
  );
}

export const Selection: Story = {
  name: "Selection & keyboard",
  render: () => <SelectionExample />,
};

const manyRows = makeManyRows(1000);

export const Virtualized: Story = {
  name: "Virtualized (1000 rows)",
  render: () => (
    <StorySurface>
      <View style={styles.frame}>
        <DataGrid
          accessibilityLabel="Content"
          columns={contentColumns}
          footerText="1000 records"
          maxHeight={380}
          rows={manyRows}
        />
      </View>
    </StorySurface>
  ),
};

function InfiniteScrollExample() {
  const [total, setTotal] = useState(30);
  const [loading, setLoading] = useState(false);
  const rows = useMemo(() => makeManyRows(total), [total]);
  const loadMore = () => {
    if (loading || total >= 300) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setTotal((current) => Math.min(300, current + 30));
      setLoading(false);
    }, 250);
  };
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status} testID="row-count">
          {rows.length} rows
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={contentColumns}
            loadingMore={loading}
            maxHeight={360}
            onEndReached={loadMore}
            rows={rows}
          />
        </View>
      </View>
    </StorySurface>
  );
}

export const InfiniteScroll: Story = {
  name: "Infinite scroll",
  render: () => <InfiniteScrollExample />,
};

function LoadingColumnExample() {
  // A freshly added column starts in a `loading` state (its values are being
  // provisioned/computed), then flips to ready — the header spinner swaps back
  // to the field-type icon in place. Any column can carry `loading` for any
  // reason; here an AI-derived "Sentiment" column toggles between analyzing and
  // ready via the button.
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState(contentRows);
  const columns = useMemo<DataGridColumn[]>(
    () => [
      ...contentColumns,
      {
        id: "sentiment",
        label: ready ? "Sentiment" : "Sentiment (analyzing…)",
        fieldType: "singleSelect",
        width: 170,
        loading: !ready,
        options: [
          { id: "pos", label: "Positive", color: "green" },
          { id: "neg", label: "Negative", color: "rose" },
        ],
      },
    ],
    [ready],
  );
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Pressable
          onPress={() => setReady((value) => !value)}
          style={styles.button}
          testID="toggle-loading"
        >
          <Text style={styles.buttonText}>
            {ready ? "Reset (mark column loading)" : "Finish loading column"}
          </Text>
        </Pressable>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={columns}
            onCellChange={(ref, value) =>
              setRows((current) =>
                current.map((row) =>
                  row.id === ref.rowId
                    ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
                    : row,
                ),
              )
            }
            rows={rows}
          />
        </View>
        <Text style={styles.hint}>
          Set `loading: true` on any column to show a spinner in place of its
          field-type icon — for a just-added column that is still provisioning,
          a computed/AI column being (re)generated, or any async header state.
          The column stays interactive; the spinner swaps in place with no
          layout shift.
        </Text>
      </View>
    </StorySurface>
  );
}

export const LoadingColumn: Story = {
  name: "Loading column (header spinner)",
  render: () => <LoadingColumnExample />,
};

function SavingCellExample() {
  const [rows, setRows] = useState(contentRows);
  const [savingCell, setSavingCell] = useState<DataGridCellRef | null>(null);

  const saveCell = async (ref: DataGridCellRef, value: DataGridCellValue) => {
    setSavingCell(ref);
    setRows((current) =>
      current.map((row) =>
        row.id === ref.rowId
          ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
          : row,
      ),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 1_200));
    setSavingCell(null);
  };

  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status} testID="cell-save-status">
          {savingCell
            ? `Saving ${savingCell.rowId}.${savingCell.columnId}…`
            : "Ready"}
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            cellLoading={(ref) =>
              dataGridSelectionModel.cellRefEquals(ref, savingCell)
            }
            columns={contentColumns}
            onCellChange={saveCell}
            rows={rows}
          />
        </View>
        <Text style={styles.hint}>
          Edit any cell and commit it. The controlled `cellLoading(ref)` state
          marks only that cell busy beside its optimistic value while this
          example simulates a save.
        </Text>
      </View>
    </StorySurface>
  );
}

export const SavingCell: Story = {
  name: "Saving cell (loading spinner)",
  render: () => <SavingCellExample />,
};

function EditableExample() {
  const [rows, setRows] = useState(contentRows);
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.hint}>
          Double-click a cell to edit. Enter commits and moves down; Escape
          cancels. Numbers reject non-numeric input. Select a range and use
          Ctrl/Cmd-C / X / V to copy, cut, and paste (a single copied cell fills
          the selection, like Excel); Delete clears the selected cells. Dates
          use an inline calendar on web and a wheel sheet on native.
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={contentColumns}
            onCellChange={(ref, value) =>
              setRows((current) =>
                current.map((row) =>
                  row.id === ref.rowId
                    ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
                    : row,
                ),
              )
            }
            rows={rows}
          />
        </View>
      </View>
    </StorySurface>
  );
}

export const Editable: Story = {
  name: "Editable cells",
  render: () => <EditableExample />,
};

function FullFeaturedExample() {
  const [columns, setColumns] = useState(contentColumns);
  const [rows, setRows] = useState(contentRows);
  const [lastAction, setLastAction] = useState("none");

  const visibleCount = columns.filter((column) => !column.hidden).length;

  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status} testID="chrome-status">
          {visibleCount} fields · {rows.length} rows · last: {lastAction}
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={columns}
            onAddColumn={(fieldType) => {
              setColumns((current) => [
                ...current,
                {
                  id: `field-${current.length + 1}`,
                  label: "New field",
                  fieldType,
                  width: 130,
                },
              ]);
              setLastAction(`add ${fieldType}`);
            }}
            onAddRow={() => {
              setRows((current) => [
                ...current,
                { id: `new-${current.length + 1}`, cells: {} },
              ]);
              setLastAction("add row");
            }}
            onCellChange={(ref, value) =>
              setRows((current) =>
                current.map((row) =>
                  row.id === ref.rowId
                    ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
                    : row,
                ),
              )
            }
            onColumnMenuAction={(columnId, action) => {
              setLastAction(`${action} ${columnId}`);
              if (action === "delete") {
                setColumns((current) =>
                  current.filter((column) => column.id !== columnId),
                );
                return;
              }
              setColumns((current) =>
                current.map((column) =>
                  column.id === columnId
                    ? {
                        ...column,
                        hidden: action === "hide" ? true : column.hidden,
                        sortDirection:
                          action === "sortAsc"
                            ? "asc"
                            : action === "sortDesc"
                              ? "desc"
                              : action === "clearSort"
                                ? null
                                : column.sortDirection,
                      }
                    : column,
                ),
              );
            }}
            rows={rows}
          />
        </View>
        <Text style={styles.hint}>
          Click a column's caret to sort/hide/delete it, the + header to add a
          field, and the bottom row to add a record. Double-click the Tags
          column to edit a multi-select.
        </Text>
      </View>
    </StorySurface>
  );
}

export const FullFeatured: Story = {
  name: "Column menu, add column & row",
  render: () => <FullFeaturedExample />,
};

function ResizableExample() {
  const [lastResize, setLastResize] = useState("none");
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status} testID="resize-status">
          last resize: {lastResize}
        </Text>
        <View style={styles.frame}>
          <DataGrid
            accessibilityLabel="Content"
            columns={contentColumns}
            onColumnResize={(columnId, width) =>
              setLastResize(`${columnId} → ${width}px`)
            }
            rows={contentRows}
          />
        </View>
        <Text style={styles.hint}>
          Drag a column header's right edge to resize it, or focus the edge and
          use the arrow keys. The grid manages the widths; onColumnResize fires
          so you can persist them.
        </Text>
      </View>
    </StorySurface>
  );
}

export const Resizable: Story = {
  name: "Resizable columns",
  render: () => <ResizableExample />,
};

export const RejectingEdit: Story = {
  name: "Editing (rejected save)",
  render: () => (
    <StorySurface>
      <View style={styles.frame}>
        <DataGrid
          accessibilityLabel="Content"
          columns={contentColumns}
          onCellChange={() => Promise.reject(new Error("save failed"))}
          rows={contentRows}
        />
      </View>
    </StorySurface>
  ),
};

export const Responsive: Story = {
  name: "Responsive (cards on mobile)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <StorySurface>
      <View style={styles.responsive}>
        <DataGrid
          accessibilityLabel="Content"
          cardBreakpoint={700}
          columns={contentColumns}
          footerText="7 of 128 records"
          onRowExpand={() => undefined}
          rows={contentRows}
        />
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#e8ebe8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: { color: "#3e4540", fontSize: 13, fontWeight: "600" },
  frame: { width: 940 },
  frameWide: { width: 1000 },
  hint: { color: "#69706a", fontSize: 12 },
  responsive: { padding: 16, width: "100%" },
  stack: { gap: 10 },
  status: { color: "#3e4540", fontSize: 13, fontWeight: "700" },
});
