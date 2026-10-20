/**
 * Sample pages for the drag-select app-shell stories: their rows, their
 * copy, and the row that every page renders. Reconciliation lists some of
 * the same transactions as Transactions, so two pages share row ids.
 */
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Button, useDragSelectableTarget, useSharedUiTheme } from "../index";

export type ShellRow = { amount: string; id: string; label: string };

const payees = [
  "Stripe payout",
  "Cursor Hosting Ltd",
  "Notion Labs Inc",
  "AWS EU-WEST",
  "Trainline",
  "Figma Inc",
  "HMRC VAT",
  "Pret A Manger",
  "Linear Orbit Inc",
  "Octopus Energy",
];

export const shellTransactions: ShellRow[] = Array.from(
  { length: 30 },
  (_, index) => ({
    amount: `-GBP ${((index * 37.5 + 12.4) % 900).toFixed(2)}`,
    id: `txn_${index + 1}`,
    label: payees[index % payees.length],
  }),
);

export const shellInvoices: ShellRow[] = Array.from(
  { length: 20 },
  (_, index) => ({
    amount: `GBP ${(index * 125 + 240).toFixed(2)}`,
    id: `inv_${index + 1}`,
    label: `Invoice INV-${String(index + 1).padStart(4, "0")}`,
  }),
);

/** The pages that the app-shell sidebar switches between. */
export const shellPageIds = [
  "transactions",
  "invoices",
  "reconciliation",
] as const;

export type ShellPageId = (typeof shellPageIds)[number];

export const shellPages: Record<
  ShellPageId,
  { body: string; rows: ShellRow[]; title: string }
> = {
  invoices: {
    body: "Invoices sent this quarter. Drag across rows to select them.",
    rows: shellInvoices,
    title: "Invoices",
  },
  reconciliation: {
    body: "Transactions to match against this month's bank statement. Drag across rows to select them.",
    rows: shellTransactions.slice(0, 10),
    title: "Reconciliation",
  },
  transactions: {
    body: "Bank transactions for this month. Drag across rows to select them, or open one to see its details.",
    rows: shellTransactions,
    title: "Transactions",
  },
};

export function rowCountLabel(count: number) {
  return `${count} row${count === 1 ? "" : "s"}`;
}

export function ShellRowView({
  onOpen,
  row,
}: {
  onOpen: (id: string) => void;
  row: ShellRow;
}) {
  const theme = useSharedUiTheme();
  const target = useDragSelectableTarget({
    data: row,
    id: row.id,
    label: `${row.label}, ${row.amount}`,
  });
  return (
    <View
      ref={target.ref}
      style={[
        styles.row,
        { borderBottomColor: theme.colors.border },
        target.matching ? { backgroundColor: theme.colors.soft } : null,
        target.selected ? { backgroundColor: theme.colors.primarySoft } : null,
      ]}
      testID={`shell-row-${row.id}`}
    >
      {/* The row holds an "Open" button, so the checkbox semantics go on a
          child: a checkbox must not contain another control. The ref stays
          on the row, which is the box that a drag measures. */}
      <View
        {...target.a11yProps}
        style={styles.rowTarget}
        testID={`shell-check-${row.id}`}
      >
        <View
          style={[
            styles.check,
            { borderColor: theme.colors.muted },
            target.selected
              ? {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                }
              : null,
          ]}
        >
          {target.selected ? (
            <Text
              aria-hidden
              importantForAccessibility="no"
              style={[styles.checkGlyph, { color: theme.colors.onSolid }]}
            >
              {"✓"}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.ink }]}>
            {row.label}
          </Text>
          <Text style={[styles.rowMeta, { color: theme.colors.muted }]}>
            {row.id}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: theme.colors.ink }]}>
        {row.amount}
      </Text>
      <Button
        accessibilityLabel={`Open ${row.label}, ${row.id}`}
        onPress={() => onOpen(row.id)}
        size="sm"
        testID={`shell-open-${row.id}`}
      >
        Open
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 13, fontWeight: "700", minWidth: 96, textAlign: "right" },
  check: {
    alignItems: "center",
    borderRadius: 4,
    borderWidth: 1.5,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  checkGlyph: { fontSize: 12, fontWeight: "800", lineHeight: 14 },
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  rowMeta: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  rowTarget: {
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "700" },
});
