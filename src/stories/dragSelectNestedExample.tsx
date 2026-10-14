/**
 * Nested providers for the drag-select stories: a panel with its own provider
 * sits inside a page-wide provider, and a press belongs to the innermost
 * provider that can take it.
 */
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  DragSelectableProvider,
  useDragSelectableChanges,
  useDragSelectableTarget,
  useSharedUiTheme,
} from "../index";

const outerRows = [
  { id: "acct_1", label: "Business current account" },
  { id: "acct_2", label: "Tax reserve" },
  { id: "acct_3", label: "Payroll" },
];

const innerRows = [
  { id: "pay_1", label: "Payment to Figma Inc" },
  { id: "pay_2", label: "Payment to HMRC VAT" },
  { id: "pay_3", label: "Payment to Octopus Energy" },
];

export function NestedProvidersExample() {
  const theme = useSharedUiTheme();
  return (
    <DragSelectableProvider
      accessibilityLabel="Accounts"
      style={[styles.outer, { borderColor: theme.colors.border }]}
      testID="nested-outer"
    >
      <NestedStatus name="Accounts" testID="nested-outer-status" />
      {outerRows.map((row) => (
        <NestedRow key={row.id} row={row} />
      ))}
      <DragSelectableProvider
        accessibilityLabel="Recent payments"
        style={[
          styles.inner,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        testID="nested-inner"
      >
        <NestedStatus name="Recent payments" testID="nested-inner-status" />
        {innerRows.map((row) => (
          <NestedRow key={row.id} row={row} />
        ))}
      </DragSelectableProvider>
    </DragSelectableProvider>
  );
}

function NestedStatus({ name, testID }: { name: string; testID: string }) {
  const theme = useSharedUiTheme();
  const state = useDragSelectableChanges(() => undefined);
  return (
    <Text style={[styles.status, { color: theme.colors.ink }]} testID={testID}>
      {`${name}: ${state.dragging ? "dragging" : "idle"}, selected ${
        state.selectedIds.join(", ") || "none"
      }`}
    </Text>
  );
}

function NestedRow({ row }: { row: { id: string; label: string } }) {
  const theme = useSharedUiTheme();
  const target = useDragSelectableTarget({ id: row.id, label: row.label });
  return (
    <View
      {...target.a11yProps}
      ref={target.ref}
      style={[
        styles.row,
        { borderColor: theme.colors.border },
        target.selected ? { backgroundColor: theme.colors.primarySoft } : null,
      ]}
      testID={`nested-row-${row.id}`}
    >
      <Text style={[styles.rowText, { color: theme.colors.ink }]}>
        {row.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 12,
    padding: 12,
  },
  outer: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minWidth: 460,
    padding: 16,
  },
  row: {
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12,
  },
  rowText: { fontSize: 13, fontWeight: "600" },
  status: { fontSize: 12, fontWeight: "700" },
});
