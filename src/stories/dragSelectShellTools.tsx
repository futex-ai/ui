/**
 * Library gesture surfaces on the invoices page of the drag-select app shell:
 * a data grid and a sortable list. Both mark their gesture roots with the
 * drag-select ignore marker, so a drag inside them never draws a selection
 * box over the page.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  applySortableMove,
  DataGrid,
  SortableList,
  useSharedUiTheme,
  type DataGridColumn,
  type DataGridRow,
} from "../index";

type Template = { id: string; name: string };

const lineColumns: DataGridColumn[] = [
  { fieldType: "text", flex: 2, id: "item", label: "Item" },
  { fieldType: "number", id: "quantity", label: "Qty", width: 80 },
  { fieldType: "number", id: "price", label: "Price", width: 100 },
];

const initialLines: DataGridRow[] = [
  {
    cells: { item: "Design retainer", price: 1200, quantity: 1 },
    id: "line_1",
  },
  { cells: { item: "Illustration", price: 300, quantity: 4 }, id: "line_2" },
  { cells: { item: "Print proofs", price: 45, quantity: 10 }, id: "line_3" },
];

const initialTemplates: Template[] = [
  { id: "tpl_standard", name: "Standard invoice" },
  { id: "tpl_retainer", name: "Monthly retainer" },
  { id: "tpl_deposit", name: "Deposit request" },
];

export function InvoiceTools() {
  const theme = useSharedUiTheme();
  const [lines, setLines] = useState(initialLines);
  const [templates, setTemplates] = useState(initialTemplates);
  return (
    <View style={styles.tools}>
      <Text style={[styles.heading, { color: theme.colors.ink }]}>
        Line items
      </Text>
      <View style={styles.grid} testID="page-shell-grid">
        <DataGrid
          accessibilityLabel="Line items"
          columns={lineColumns}
          onCellChange={(ref, value) =>
            setLines((current) =>
              current.map((row) =>
                row.id === ref.rowId
                  ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
                  : row,
              ),
            )
          }
          rows={lines}
        />
      </View>
      <Text style={[styles.heading, { color: theme.colors.ink }]}>
        Templates
      </Text>
      <View testID="page-shell-templates">
        <SortableList<Template>
          accessibilityLabel="Invoice templates"
          gap={6}
          itemKey={(template) => template.id}
          itemLabel={(template) => template.name}
          items={templates}
          onReorder={(move) =>
            setTemplates((current) =>
              applySortableMove(current, move, (template) => template.id),
            )
          }
          renderItem={(template) => (
            <View
              style={[
                styles.template,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.templateText, { color: theme.colors.ink }]}>
                {template.name}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { height: 170 },
  heading: { fontSize: 14, fontWeight: "800", marginTop: 20 },
  template: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12,
  },
  templateText: { fontSize: 13, fontWeight: "600" },
  tools: { gap: 8 },
});
