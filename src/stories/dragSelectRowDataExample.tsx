/**
 * Row data in drag-select callbacks: each row passes its invoice as target
 * `data`, and `onSelectionChange` receives that data in `selectedTargets`
 * when the selection changes. Marking an invoice paid changes its data, so
 * the next selection change reports the new status.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  Button,
  DragSelectableProvider,
  useDragSelectableTarget,
  useSharedUiTheme,
  type DragSelectableSelection,
} from "../index";

type Invoice = { id: string; number: string; paid: boolean };

const initialInvoices: Invoice[] = [
  { id: "inv_1", number: "INV-0001", paid: false },
  { id: "inv_2", number: "INV-0002", paid: false },
  { id: "inv_3", number: "INV-0003", paid: true },
  { id: "inv_4", number: "INV-0004", paid: false },
];

function invoiceSummary(invoice: Invoice) {
  return `${invoice.number} ${invoice.paid ? "paid" : "unpaid"}`;
}

function selectionSummary(selection: DragSelectableSelection) {
  return (
    selection.selectedTargets
      .map((target) => invoiceSummary(target.data as Invoice))
      .join(", ") || "none"
  );
}

export function RowDataExample() {
  const theme = useSharedUiTheme();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [lastChange, setLastChange] = useState("none");
  const togglePaid = (id: string) =>
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === id ? { ...invoice, paid: !invoice.paid } : invoice,
      ),
    );
  return (
    <DragSelectableProvider
      accessibilityLabel="Invoices"
      onSelectionChange={(selection) =>
        setLastChange(selectionSummary(selection))
      }
      style={styles.page}
    >
      <Text
        style={[styles.status, { color: theme.colors.ink }]}
        testID="row-data-last-change"
      >
        {`Selected invoices: ${lastChange}`}
      </Text>
      <View
        style={[
          styles.list,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {invoices.map((invoice) => (
          <InvoiceRow
            invoice={invoice}
            key={invoice.id}
            onTogglePaid={togglePaid}
          />
        ))}
      </View>
    </DragSelectableProvider>
  );
}

function InvoiceRow({
  invoice,
  onTogglePaid,
}: {
  invoice: Invoice;
  onTogglePaid: (id: string) => void;
}) {
  const theme = useSharedUiTheme();
  const target = useDragSelectableTarget({
    data: invoice,
    id: invoice.id,
    label: invoice.number,
  });
  return (
    <View
      ref={target.ref}
      style={[
        styles.row,
        { borderBottomColor: theme.colors.border },
        target.selected ? { backgroundColor: theme.colors.primarySoft } : null,
      ]}
      testID={`row-data-${invoice.id}`}
    >
      <View {...target.a11yProps} style={styles.rowTarget}>
        <Text
          aria-hidden
          importantForAccessibility="no"
          style={[styles.mark, { color: theme.colors.primaryDeep }]}
        >
          {target.selected ? "✓" : " "}
        </Text>
        <Text style={[styles.number, { color: theme.colors.ink }]}>
          {invoice.number}
        </Text>
        <Text style={[styles.paid, { color: theme.colors.muted }]}>
          {invoice.paid ? "Paid" : "Unpaid"}
        </Text>
      </View>
      <Button
        accessibilityLabel={`Mark ${invoice.number} ${
          invoice.paid ? "unpaid" : "paid"
        }`}
        onPress={() => onTogglePaid(invoice.id)}
        size="sm"
        testID={`row-data-toggle-${invoice.id}`}
      >
        {invoice.paid ? "Mark unpaid" : "Mark paid"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  mark: { fontSize: 13, fontWeight: "800", width: 14 },
  number: { flex: 1, fontSize: 13, fontWeight: "700" },
  page: { gap: 12, minWidth: 460 },
  paid: { fontSize: 12, fontWeight: "600", minWidth: 56 },
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  rowTarget: {
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  status: { fontSize: 13, fontWeight: "700" },
});
