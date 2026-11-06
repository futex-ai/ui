/**
 * Library surfaces on the invoices page of the drag-select app shell, where a
 * press must not start a page drag. The invoice filter is a text field inside
 * the provider element, so the provider refuses a press inside it as a press
 * in a field. The data grid and the sortable list mark their gesture roots
 * with the drag-select ignore marker, so a drag inside them draws no
 * selection box over the page. The note modal draws through a portal outside
 * the provider element, so the provider ignores a press inside it, although
 * React sends that press through the page to the provider.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  applySortableMove,
  Button,
  DataGrid,
  Input,
  SortableList,
  WebModalFrame,
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

/**
 * The "Filter invoices" field. The page lists the invoices whose number
 * contains its text.
 */
export function InvoiceFilter({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.filter}>
      <Input
        clearable
        label="Filter invoices"
        onChangeText={onChange}
        placeholder="INV-0012"
        value={value}
      />
    </View>
  );
}

/**
 * The "Add a note" button and its modal. The page renders it, so the modal is
 * in the page's React subtree, while its portal draws it under the document
 * body, outside the provider element.
 */
export function InvoiceNote() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const close = () => setOpen(false);
  return (
    <View style={styles.note}>
      <Button hasPopup="dialog" onPress={() => setOpen(true)} size="sm">
        Add a note
      </Button>
      <WebModalFrame
        footer={
          <Button onPress={close} tone="primary">
            Done
          </Button>
        }
        onClose={close}
        size="sm"
        title="Add a note"
        visible={open}
      >
        <Input label="Note" onChangeText={setNote} value={note} />
      </WebModalFrame>
    </View>
  );
}

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
  filter: { marginBottom: 12 },
  grid: { height: 170 },
  heading: { fontSize: 14, fontWeight: "800", marginTop: 20 },
  note: { alignItems: "flex-start", marginBottom: 16 },
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
