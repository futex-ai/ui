import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  DragSelectableProvider,
  useDragSelectableChanges,
  useDragSelectableTarget,
} from "../index";
import { StorySurface } from "./sharedExamples";

const rows = [
  { amount: "+GBP 4,812.10", id: "txn_1", label: "Stripe payout" },
  { amount: "-GBP 480.00", id: "txn_2", label: "Cursor Hosting Ltd" },
  { amount: "-GBP 24.00", id: "txn_3", label: "Notion Labs Inc" },
  { amount: "-GBP 312.18", id: "txn_4", label: "AWS EU-WEST" },
  { amount: "-GBP 142.20", id: "txn_5", label: "Trainline" },
];

function transactionCountLabel(count: number) {
  return `${count} transaction${count === 1 ? "" : "s"}`;
}

const meta = {
  title: "Drag Select/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LedgerRows: Story = {
  name: "Ledger rows",
  render: () => (
    <StorySurface>
      <LedgerRowsExample />
    </StorySurface>
  ),
};

export const PageContentArea: Story = {
  name: "Page content area",
  render: () => (
    <StorySurface>
      <PageContentAreaExample />
    </StorySurface>
  ),
};

export const LargerMinimumDrag: Story = {
  name: "Larger minimum drag",
  render: () => (
    <StorySurface>
      <LargerMinimumDragExample />
    </StorySurface>
  ),
};

function LedgerRowsExample() {
  return (
    <DragSelectableProvider
      selectionLabel={(count) => transactionCountLabel(count)}
      style={styles.shell}
    >
      <SelectionStatus />
      <View style={styles.list}>
        {rows.map((row) => (
          <LedgerRow key={row.id} row={row} />
        ))}
      </View>
    </DragSelectableProvider>
  );
}

function PageContentAreaExample() {
  return (
    <DragSelectableProvider
      selectionLabel={(count) => transactionCountLabel(count)}
      style={[styles.shell, styles.pageArea]}
    >
      <SelectionStatus />
      <View style={styles.pageBody}>
        <View
          style={styles.pageStartZone}
          testID="drag-page-content-start-zone"
        />
        <View style={[styles.list, styles.pageList]}>
          {rows.map((row) => (
            <LedgerRow key={row.id} row={row} />
          ))}
        </View>
      </View>
    </DragSelectableProvider>
  );
}

function LargerMinimumDragExample() {
  return (
    <DragSelectableProvider
      minimumDragDistance={24}
      selectionLabel={(count) => transactionCountLabel(count)}
      style={styles.shell}
    >
      <SelectionStatus />
      <View style={styles.list}>
        {rows.map((row) => (
          <LedgerRow key={row.id} row={row} />
        ))}
      </View>
    </DragSelectableProvider>
  );
}

function SelectionStatus() {
  const [lastChange, setLastChange] = useState("none");
  const state = useDragSelectableChanges((next) => {
    setLastChange(next.selectedIds.join(", ") || "none");
  });
  return (
    <View style={styles.status}>
      <Text style={styles.statusTitle}>
        Selected {transactionCountLabel(state.selectedCount)}
      </Text>
      <Text style={styles.statusMeta}>
        {state.dragging
          ? `Matching ${transactionCountLabel(state.matchingCount)}`
          : `Last change: ${lastChange}`}
      </Text>
    </View>
  );
}

function LedgerRow({ row }: { row: (typeof rows)[number] }) {
  const target = useDragSelectableTarget({
    data: row,
    id: row.id,
  });
  return (
    <View
      ref={target.ref}
      style={[
        styles.row,
        target.matching ? styles.rowMatching : null,
        target.selected ? styles.rowSelected : null,
      ]}
      testID={`drag-target-${row.id}`}
    >
      <View>
        <Text style={styles.rowTitle}>{row.label}</Text>
        <Text style={styles.rowMeta}>{row.id}</Text>
      </View>
      <Text style={styles.amount}>{row.amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "800",
  },
  list: {
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  pageArea: {
    backgroundColor: "#f7f7f3",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 420,
    padding: 16,
  },
  pageBody: {
    flexDirection: "row",
    gap: 12,
  },
  pageList: {
    flex: 1,
  },
  pageStartZone: {
    backgroundColor: "#ecede7",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 260,
    width: 120,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e8e0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 12,
  },
  rowMatching: {
    backgroundColor: "#eef2ed",
  },
  rowMeta: {
    color: "#737b75",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  rowSelected: {
    backgroundColor: "#e3eee6",
  },
  rowTitle: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "800",
  },
  shell: {
    gap: 12,
    minWidth: 460,
  },
  status: {
    backgroundColor: "#f7f7f3",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: 12,
  },
  statusMeta: {
    color: "#737b75",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "800",
  },
});
