import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  SelectableProvider,
  type SelectableSelection,
  useSelectableSelectionChange,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Selectable/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const invoiceRows = [
  {
    amount: "GBP 4,260",
    due: "Due 18 Jun",
    id: "selectable-invoice-greenhouse",
    name: "Greenhouse Studio",
  },
  {
    amount: "GBP 9,840",
    due: "Due 24 Jun",
    id: "selectable-invoice-payroll",
    name: "Payroll Reserve",
  },
  {
    amount: "GBP 1,125",
    due: "Due 30 Jun",
    id: "selectable-invoice-vat",
    name: "VAT Archive",
  },
];

export const SelectionObserver: Story = {
  name: "Selection observer",
  render: () => (
    <StorySurface>
      <SelectableProvider selector="[id^='selectable-invoice-']">
        <SelectableExample />
      </SelectableProvider>
    </StorySurface>
  ),
};

function SelectableExample() {
  const [lastChangeIds, setLastChangeIds] = useState("None");
  const handleSelectionChange = useCallback(
    (selection: SelectableSelection) => {
      setLastChangeIds(selection.selectedIds.join(", ") || "None");
    },
    [],
  );
  const selection = useSelectableSelectionChange(handleSelectionChange);
  const selectedIds = selection.selectedIds.join(", ") || "None";

  return (
    <View style={styles.layout}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Selected matching elements</Text>
        <Text style={styles.summaryValue}>{selection.selectedCount}</Text>
        <Text style={styles.summaryText}>Selected IDs: {selectedIds}</Text>
        <Text style={styles.summaryText}>Last change IDs: {lastChangeIds}</Text>
      </View>
      <View style={styles.list}>
        {invoiceRows.map((row) => (
          <View key={row.id} nativeID={row.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text selectable style={styles.rowTitle}>
                {row.name}
              </Text>
              <Text selectable style={styles.rowMeta}>
                {row.due}
              </Text>
            </View>
            <Text selectable style={styles.amount}>
              {row.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: "#2f5945",
    fontSize: 14,
    fontWeight: "700",
  },
  layout: {
    gap: 16,
    minWidth: 360,
  },
  list: {
    borderColor: "#d6ded8",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e6ece8",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 20,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowMain: {
    gap: 4,
  },
  rowMeta: {
    color: "#69736d",
    fontSize: 13,
  },
  rowTitle: {
    color: "#202823",
    fontSize: 15,
    fontWeight: "700",
  },
  summary: {
    backgroundColor: "#f3f6f4",
    borderColor: "#d6ded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  summaryLabel: {
    color: "#52605a",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryText: {
    color: "#3e4540",
    fontSize: 13,
  },
  summaryValue: {
    color: "#202823",
    fontSize: 28,
    fontWeight: "700",
  },
});
