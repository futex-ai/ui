import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Button,
  Table,
  TableCell,
  darkSharedUiTheme,
  useSharedUiTheme,
  type TableColumn,
} from "../index";
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View
        style={[styles.card, { borderColor: darkSharedUiTheme.colors.border }]}
      >
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

export const Loading: Story = {
  name: "Loading",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <Table<Invoice>
          accessibilityLabel="Invoices"
          cell={invoiceCell}
          columns={columns}
          loading
          rowKey={(row) => row.id}
          rows={[]}
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

type EmployeeStatus = { label: string; tone: "active" | "leaving" | "new" };

type Employee = {
  avatarColor: string;
  gross: string;
  id: string;
  initials: string;
  name: string;
  niCat: string;
  payrollId: string;
  role: string;
  status: EmployeeStatus;
  taxCode: string;
};

const employees: Employee[] = [
  {
    avatarColor: "#4f7864",
    gross: "£6,250.00",
    id: "emp_1",
    initials: "MO",
    name: "Maya Okafor",
    niCat: "A",
    payrollId: "GS-001",
    role: "Director",
    status: { label: "Active", tone: "active" },
    taxCode: "Tax code 1257L",
  },
  {
    avatarColor: "#a84f45",
    gross: "£4,583.33",
    id: "emp_2",
    initials: "PA",
    name: "Priya Anand",
    niCat: "A",
    payrollId: "GS-004",
    role: "Senior Engineer",
    status: { label: "Active", tone: "active" },
    taxCode: "Tax code 1257L",
  },
  {
    avatarColor: "#315f96",
    gross: "£3,750.00",
    id: "emp_3",
    initials: "TW",
    name: "Tom Whitfield",
    niCat: "A",
    payrollId: "GS-007",
    role: "Product Designer",
    status: { label: "Active", tone: "active" },
    taxCode: "Tax code 1257L",
  },
  {
    avatarColor: "#946727",
    gross: "£1,600.00",
    id: "emp_4",
    initials: "JL",
    name: "Jordan Lee",
    niCat: "H",
    payrollId: "GS-009",
    role: "Apprentice Developer",
    status: { label: "New starter", tone: "new" },
    taxCode: "Tax code 1257L",
  },
  {
    avatarColor: "#6f5bd0",
    gross: "£3,333.33",
    id: "emp_5",
    initials: "SM",
    name: "Sofia Marenco",
    niCat: "A",
    payrollId: "GS-006",
    role: "Marketing Lead",
    status: { label: "Leaving 31 May", tone: "leaving" },
    taxCode: "Tax code 1257L",
  },
];

const employeeColumns: TableColumn[] = [
  { flex: 2, key: "name", label: "Name" },
  { flex: 1.5, key: "role", label: "Role" },
  { key: "payrollId", label: "Payroll ID", width: 110 },
  { key: "niCat", label: "NI Cat", width: 70 },
  { key: "status", label: "Status", width: 130 },
  { align: "right", key: "gross", label: "Monthly gross", width: 140 },
  { align: "right", key: "action", width: 80 },
];

function employeeCell(
  row: Employee,
  key: string,
  onOpen: (name: string) => void,
) {
  if (key === "name") return <NameCell employee={row} />;
  if (key === "role") return <TableCell>{row.role}</TableCell>;
  if (key === "payrollId") return <TableCell muted>{row.payrollId}</TableCell>;
  if (key === "niCat") return <TableCell muted>{row.niCat}</TableCell>;
  if (key === "status") return <StatusBadge status={row.status} />;
  if (key === "gross") return <TableCell numeric>{row.gross}</TableCell>;
  return (
    <Button
      accessibilityLabel={`Open ${row.name}`}
      onPress={() => onOpen(row.name)}
      size="sm"
      tone="ghost"
    >
      Open
    </Button>
  );
}

export const RichCells: Story = {
  name: "Rich cells",
  render: () => (
    <StorySurface>
      <RichCellsExample />
    </StorySurface>
  ),
};

function RichCellsExample() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <View style={styles.stack}>
      <Text style={styles.status}>
        {opened ? `Opened ${opened}` : "Each row has an Open action."}
      </Text>
      <View style={styles.wideCard}>
        <Table<Employee>
          accessibilityLabel="Employees"
          cell={(row, key) => employeeCell(row, key, setOpened)}
          columns={employeeColumns}
          rowKey={(row) => row.id}
          rows={employees}
        />
      </View>
    </View>
  );
}

/** A two-line name cell: a coloured initials avatar beside the name + tax code. */
function NameCell({ employee }: { employee: Employee }) {
  return (
    <View style={styles.nameCell}>
      <Avatar
        accessibilityLabel={employee.name}
        label={employee.initials}
        size={34}
        style={{ backgroundColor: employee.avatarColor }}
        textColor="#fff"
      />
      <View style={styles.nameText}>
        <Text style={styles.namePrimary}>{employee.name}</Text>
        <Text style={styles.nameSecondary}>{employee.taxCode}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const tone =
    status.tone === "active"
      ? styles.badgeSage
      : status.tone === "new"
        ? styles.badgeBlue
        : styles.badgeAmber;
  const text =
    status.tone === "active"
      ? styles.badgeSageText
      : status.tone === "new"
        ? styles.badgeBlueText
        : styles.badgeAmberText;
  return (
    <View style={[styles.badge, tone]}>
      <Text style={[styles.badgeText, text]}>{status.label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Invoice["status"] }) {
  // The three fills are the theme's own soft tints (the same values that were
  // hardcoded here), so the pills invert with the palette instead of staying
  // light chips on a dark table.
  const { colors } = useSharedUiTheme();
  const backgroundColor =
    status === "Paid"
      ? colors.primarySoft
      : status === "Overdue"
        ? colors.roseSoft
        : colors.soft;
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color: colors.ink2 }]}>{status}</Text>
    </View>
  );
}

// A balance sheet groups its lines under section headers and closes each group
// with a shaded subtotal — the kind of sectioned, banded table the Table
// primitive supports via the `rowStyle` hook (the bands) and `TableCell bold`
// (the totals), with the section headers rendered as plain nodes.
type BalanceRow =
  | { id: string; kind: "section"; label: string }
  | {
      current: string;
      id: string;
      kind: "data" | "total";
      label: string;
      prior: string;
    };

const balanceColumns: TableColumn[] = [
  { flex: 1, key: "line", label: "Line" },
  { align: "right", key: "current", label: "5 Apr 2026", width: 120 },
  { align: "right", key: "prior", label: "5 Apr 2025", width: 120 },
];

const balanceRows: BalanceRow[] = [
  { id: "assets", kind: "section", label: "Assets" },
  {
    current: "£21,640.00",
    id: "hsbc",
    kind: "data",
    label: "Cash — HSBC current",
    prior: "£16,420.00",
  },
  {
    current: "£8,420.00",
    id: "letting",
    kind: "data",
    label: "Cash — letting account",
    prior: "£6,120.00",
  },
  {
    current: "£2,400.00",
    id: "rent",
    kind: "data",
    label: "Rent receivable",
    prior: "£1,200.00",
  },
  {
    current: "£9,720.00",
    id: "equipment",
    kind: "data",
    label: "Office equipment",
    prior: "£10,800.00",
  },
  {
    current: "£42,180.00",
    id: "total-assets",
    kind: "total",
    label: "Total assets",
    prior: "£34,540.00",
  },
  { id: "liabilities", kind: "section", label: "Liabilities" },
  {
    current: "£1,840.00",
    id: "payables",
    kind: "data",
    label: "Trade payables",
    prior: "£980.00",
  },
  {
    current: "£2,400.00",
    id: "deposits",
    kind: "data",
    label: "Tenant deposits held",
    prior: "£2,400.00",
  },
  {
    current: "£2,000.00",
    id: "vat",
    kind: "data",
    label: "VAT owed",
    prior: "£1,640.00",
  },
  {
    current: "£6,240.00",
    id: "total-liabilities",
    kind: "total",
    label: "Total liabilities",
    prior: "£5,020.00",
  },
  {
    current: "£35,940.00",
    id: "capital",
    kind: "total",
    label: "Capital account",
    prior: "£29,520.00",
  },
];

function balanceCell(row: BalanceRow, key: string) {
  // Section headers ("Assets" / "Liabilities") show a single uppercase label;
  // the amount columns render nothing. The Table uppercases column headers but
  // not body cells, so this mirrors the header treatment with a plain node.
  if (row.kind === "section") {
    return key === "line" ? (
      <Text style={styles.sectionLabel}>{row.label}</Text>
    ) : null;
  }
  // Totals get a bold label; data-row labels are plain. Amounts are always the
  // bold, right-aligned, tabular-figure numeric cell.
  if (key === "line") {
    return <TableCell bold={row.kind === "total"}>{row.label}</TableCell>;
  }
  return (
    <TableCell numeric>{key === "current" ? row.current : row.prior}</TableCell>
  );
}

/** Shade the section-header and subtotal rows; data rows keep the default fill. */
function balanceRowStyle(row: BalanceRow) {
  return row.kind === "section" || row.kind === "total"
    ? styles.bandRow
    : undefined;
}

export const BalanceSheet: Story = {
  name: "Balance sheet (sectioned)",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <Table<BalanceRow>
          accessibilityLabel="Balance sheet"
          cell={balanceCell}
          columns={balanceColumns}
          rowKey={(row) => row.id}
          rows={balanceRows}
          rowStyle={balanceRowStyle}
        />
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeAmber: { backgroundColor: "#f4ecd8" },
  // Darkened from the #946727 amber token (4.22:1 on the cream badge) to clear
  // the 4.5:1 AA text-contrast floor (#74511f ≈ 6.07:1), matching avatar.stories.
  badgeAmberText: { color: "#74511f" },
  badgeBlue: { backgroundColor: "#dbe7f3" },
  badgeBlueText: { color: "#315f96" },
  badgeSage: { backgroundColor: "#e3eee6" },
  badgeSageText: { color: "#2f5945" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  // The shaded band behind section headers and subtotal rows. Light enough that
  // the bold black totals (and the darker-than-muted section label) clear AA.
  bandRow: { backgroundColor: "#eef2ed" },
  card: {
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 520,
  },
  hint: {
    // Aligned to the muted token (#69706a ≈ 5.09:1); #737b75 was 4.36:1 on white.
    color: "#69706a",
    fontSize: 12,
  },
  nameCell: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  namePrimary: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  nameSecondary: {
    // Aligned to the muted token (#69706a ≈ 5.09:1); #737b75 was 4.36:1 on white.
    color: "#69706a",
    fontSize: 12,
    lineHeight: 16,
  },
  nameText: { flex: 1, minWidth: 0 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sectionLabel: {
    // Darker than the muted token (#69706a ≈ 4.5:1 on the band — borderline) so
    // the uppercase section label clears the 4.5:1 AA floor (#5e645e ≈ 5.3:1).
    color: "#5e645e",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  wideCard: {
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 820,
  },
});
