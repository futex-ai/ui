import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Table, TableCell, type TableColumn } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Table/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type Invoice = {
  amount: string;
  id: string;
  issued: string;
  number: string;
  status: "Draft" | "Overdue" | "Paid";
};

const invoices: Invoice[] = [
  {
    amount: "£1,240.00",
    id: "inv_1",
    issued: "1 Jun",
    number: "INV-0007",
    status: "Paid",
  },
  {
    amount: "£480.00",
    id: "inv_2",
    issued: "4 Jun",
    number: "INV-0008",
    status: "Overdue",
  },
  {
    amount: "£3,015.50",
    id: "inv_3",
    issued: "9 Jun",
    number: "INV-0009",
    status: "Draft",
  },
];

const columns: TableColumn[] = [
  { flex: 2, key: "number", label: "Invoice" },
  { key: "issued", label: "Issued", width: 90 },
  { key: "status", label: "Status", width: 110 },
  { align: "right", key: "amount", label: "Amount", width: 120 },
];

function invoiceCell(row: Invoice, key: string) {
  if (key === "number") return <TableCell>{row.number}</TableCell>;
  if (key === "issued") return <TableCell muted>{row.issued}</TableCell>;
  if (key === "status") return <StatusPill status={row.status} />;
  return <TableCell numeric>{row.amount}</TableCell>;
}

export const WithHeaders: Story = {
  name: "With headers",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <Table<Invoice>
          accessibilityLabel="Invoices"
          cell={invoiceCell}
          columns={columns}
          rowKey={(row) => row.id}
          rows={invoices}
        />
      </View>
    </StorySurface>
  ),
};

export const Headless: Story = {
  name: "Headless",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <Table<Invoice>
          cell={invoiceCell}
          columns={columns}
          headless
          rowKey={(row) => row.id}
          rows={invoices}
        />
      </View>
    </StorySurface>
  ),
};

export const ClickableRows: Story = {
  name: "Clickable rows",
  render: () => (
    <StorySurface>
      <ClickableExample />
    </StorySurface>
  ),
};

function ClickableExample() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <View style={styles.stack}>
      <Text style={styles.status}>
        {opened
          ? `Opened ${opened}`
          : "Click or focus + Enter a row to open it"}
      </Text>
      <View style={styles.card}>
        <Table<Invoice>
          cell={invoiceCell}
          columns={columns}
          onRowPress={(row) => setOpened(row.number)}
          rowDisabled={(row) => row.status === "Draft"}
          rowKey={(row) => row.id}
          rowLabel={(row) => `Open invoice ${row.number}`}
          rows={invoices}
        />
      </View>
      <Text style={styles.hint}>
        The draft row is disabled and cannot be opened.
      </Text>
    </View>
  );
}

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <View key={size}>
            <Text style={styles.status}>{size}</Text>
            <View style={styles.card}>
              <Table<Invoice>
                cell={invoiceCell}
                columns={columns}
                rowKey={(row) => row.id}
                rows={invoices}
                size={size}
              />
            </View>
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

function StatusPill({ status }: { status: Invoice["status"] }) {
  const tone =
    status === "Paid"
      ? styles.pillPaid
      : status === "Overdue"
        ? styles.pillOverdue
        : styles.pillDraft;
  return (
    <View style={[styles.pill, tone]}>
      <Text style={styles.pillText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 520,
  },
  hint: {
    color: "#737b75",
    fontSize: 12,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillDraft: { backgroundColor: "#eef2ed" },
  pillOverdue: { backgroundColor: "#f4e3df" },
  pillPaid: { backgroundColor: "#e3eee6" },
  pillText: {
    color: "#3e4540",
    fontSize: 11,
    fontWeight: "700",
  },
  stack: {
    gap: 12,
  },
  status: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
});
