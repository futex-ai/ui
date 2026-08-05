import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DragSelectableState } from "../index";
import {
  DragSelectableProvider,
  hideWebOutlineView,
  useDragSelectableChanges,
  darkSharedUiTheme,
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
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

export const DisabledDuringDrag: Story = {
  name: "Disabled during drag",
  render: () => (
    <StorySurface>
      <DisabledDuringDragExample />
    </StorySurface>
  ),
};

function LedgerRowsExample() {
  return (
    <DragSelectableProvider
      accessibilityLabel="Transactions"
      role="group"
      selectionAnnouncement={(count) =>
        `${transactionCountLabel(count)} selected`
      }
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
      accessibilityLabel="Transactions"
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
      accessibilityLabel="Transactions"
      minimumDragDistance={24}
      role="group"
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

function DisabledDuringDragExample() {
  const [disabled, setDisabled] = useState(false);
  return (
    <DragSelectableProvider
      accessibilityLabel="Transactions"
      disabled={disabled}
      role="group"
      selectionLabel={(count) => transactionCountLabel(count)}
      style={styles.shell}
    >
      <SelectionStatus
        onStateChange={(state) => {
          if (state.matchingCount > 0) {
            setDisabled(true);
          }
        }}
      />
      <Text style={styles.statusMeta} testID="drag-disabled-state">
        {disabled ? "Drag disabled" : "Drag enabled"}
      </Text>
      <View style={styles.list}>
        {rows.map((row) => (
          <LedgerRow key={row.id} row={row} />
        ))}
      </View>
    </DragSelectableProvider>
  );
}

function SelectionStatus({
  onStateChange,
}: {
  onStateChange?: (state: DragSelectableState) => void;
}) {
  const [lastChange, setLastChange] = useState("none");
  const state = useDragSelectableChanges((next) => {
    setLastChange(next.selectedIds.join(", ") || "none");
    onStateChange?.(next);
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
    // The visible row label doubles as the accessible name so the keyboard
    // checkbox is announced meaningfully (WCAG 2.1 — 4.1.2 / 2.5.3).
    label: `${row.label}, ${row.amount}`,
  });
  return (
    <View
      {...target.a11yProps}
      ref={target.ref}
      style={[
        styles.row,
        target.matching ? styles.rowMatching : null,
        target.selected ? styles.rowSelected : null,
        // Geometry-bearing keyboard-focus ring, applied last so it is never
        // clobbered by the selection background (WCAG 2.1 — 2.4.7, AA).
        target.focused ? target.focusRingStyle : null,
        hideWebOutlineView,
      ]}
      testID={`drag-target-${row.id}`}
    >
      <View style={styles.rowMain}>
        {/* Non-color selection affordance: a check glyph marks the selected
            row so the state does not rely on background color alone (WCAG 2.1
            — 1.4.1 Use of Color, A). State is exposed to AT via `aria-checked`,
            so the glyph is hidden from assistive tech. */}
        <View
          style={[
            styles.checkBox,
            target.selected ? styles.checkBoxSelected : null,
          ]}
        >
          {target.selected ? (
            <Text
              aria-hidden
              importantForAccessibility="no"
              style={styles.checkGlyph}
            >
              {"✓"}
            </Text>
          ) : null}
        </View>
        <View>
          <Text style={styles.rowTitle}>{row.label}</Text>
          <Text style={styles.rowMeta}>{row.id}</Text>
        </View>
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
  checkBox: {
    alignItems: "center",
    borderColor: "#868d86",
    borderRadius: 4,
    borderWidth: 1.5,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  checkBoxSelected: {
    backgroundColor: "#2f5945",
    borderColor: "#2f5945",
  },
  checkGlyph: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
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
  rowMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rowMatching: {
    backgroundColor: "#eef2ed",
  },
  rowMeta: {
    color: "#69706a",
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
    color: "#69706a",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "800",
  },
});
