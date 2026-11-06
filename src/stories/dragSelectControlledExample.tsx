/**
 * A controlled drag-select example in the app-shell pattern: the provider
 * wraps the page, and the page owns the selection through
 * `useDragSelectableOptions`. A click selects one row, Command-click or
 * Control-click toggles a row, Shift-click selects a range, the toolbar
 * clears the selection, and a drag or a key sends a proposal that the page
 * applies unless the selection is locked. The lock changes only the page's
 * callback, so the provider must read the callback when it calls it. A page
 * can start with a restored selection, which is its starting selection and
 * not a change.
 */
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "../primitives/reactNative";

import {
  Button,
  DragSelectableProvider,
  Switch,
  useDragSelectableOptions,
  useDragSelectableTarget,
  useSharedUiTheme,
  type DragSelectableSelectionChange,
} from "../index";
import { shellTransactions } from "./dragSelectShellRow";

const rows = shellTransactions.slice(0, 8);
const rowIds = rows.map((row) => row.id);

type ProposalLog = { count: number; last: string };

type ClickKeys = {
  key?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
};

export function ControlledSelectionExample({
  initialSelectedIds = [],
}: {
  initialSelectedIds?: string[];
}) {
  const [changes, setChanges] = useState(0);
  return (
    <DragSelectableProvider
      onSelectionChange={() => setChanges((count) => count + 1)}
      selectionAnnouncement={(count) =>
        `${count} transaction${count === 1 ? "" : "s"} selected`
      }
      style={styles.page}
    >
      <ControlledPage
        changes={changes}
        initialSelectedIds={initialSelectedIds}
      />
    </DragSelectableProvider>
  );
}

function ControlledPage({
  changes,
  initialSelectedIds,
}: {
  changes: number;
  initialSelectedIds: string[];
}) {
  const theme = useSharedUiTheme();
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [log, setLog] = useState<ProposalLog>({ count: 0, last: "none" });

  const onSelectedIdsChange = (
    ids: string[],
    change: DragSelectableSelectionChange,
  ) => {
    setLog((current) => ({
      count: current.count + 1,
      last: `${ids.join(", ") || "none"} (${change.source}, ${change.mode})`,
    }));
    if (!locked) {
      setSelectedIds(ids);
    }
  };

  useDragSelectableOptions({ onSelectedIdsChange, selectedIds });

  const onRowPress = (id: string, event: GestureResponderEvent) => {
    const keys = event.nativeEvent as unknown as ClickKeys;
    if (keys.key !== undefined) {
      return;
    }
    if (keys.shiftKey && anchor) {
      const [from, to] = [rowIds.indexOf(anchor), rowIds.indexOf(id)].sort(
        (a, b) => a - b,
      );
      setSelectedIds(rowIds.slice(from, to + 1));
      return;
    }
    setAnchor(id);
    setSelectedIds((current) =>
      keys.metaKey || keys.ctrlKey
        ? current.includes(id)
          ? current.filter((selected) => selected !== id)
          : [...current, id]
        : [id],
    );
  };

  return (
    <>
      <View style={[styles.toolbar, { borderColor: theme.colors.border }]}>
        <Text
          style={[styles.count, { color: theme.colors.ink }]}
          testID="controlled-count"
        >
          {`${selectedIds.length} selected`}
        </Text>
        <Button
          onPress={
            selectedIds.length > 0 ? () => setSelectedIds([]) : undefined
          }
          size="sm"
          testID="controlled-clear"
        >
          Clear
        </Button>
        <View style={styles.lock}>
          <Text
            nativeID="controlled-lock-label"
            style={[styles.meta, { color: theme.colors.ink }]}
          >
            Lock selection
          </Text>
          <Switch
            aria-labelledby="controlled-lock-label"
            onValueChange={setLocked}
            size="sm"
            testID="controlled-lock"
            value={locked}
          />
        </View>
      </View>
      <Text
        style={[styles.meta, { color: theme.colors.muted }]}
        testID="controlled-log"
      >
        {`Proposals: ${log.count}. Last: ${log.last}`}
      </Text>
      <Text
        style={[styles.meta, { color: theme.colors.muted }]}
        testID="controlled-changes"
      >
        {`Selection changes: ${changes}`}
      </Text>
      <View
        accessibilityLabel="Transactions"
        role="group"
        style={[styles.list, { borderColor: theme.colors.border }]}
      >
        {rows.map((row) => (
          <ControlledRow key={row.id} onPress={onRowPress} row={row} />
        ))}
      </View>
    </>
  );
}

function ControlledRow({
  onPress,
  row,
}: {
  onPress: (id: string, event: GestureResponderEvent) => void;
  row: (typeof rows)[number];
}) {
  const theme = useSharedUiTheme();
  const target = useDragSelectableTarget({
    data: row,
    id: row.id,
    label: `${row.label}, ${row.amount}`,
  });
  return (
    <Pressable
      {...target.a11yProps}
      onPress={(event) => onPress(row.id, event)}
      ref={target.ref}
      style={[
        styles.row,
        {
          backgroundColor: target.selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
      testID={`controlled-row-${row.id}`}
    >
      <Text
        aria-hidden
        importantForAccessibility="no"
        style={[styles.mark, { color: theme.colors.primaryDeep }]}
      >
        {target.selected ? "✓" : " "}
      </Text>
      <Text style={[styles.label, { color: theme.colors.ink }]}>
        {row.label}
      </Text>
      <Text style={[styles.amount, { color: theme.colors.ink }]}>
        {row.amount}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 13, fontWeight: "700" },
  count: { fontSize: 14, fontWeight: "800", minWidth: 96 },
  label: { flex: 1, fontSize: 13, fontWeight: "600" },
  list: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  lock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  mark: { fontSize: 13, fontWeight: "800", width: 14 },
  meta: { fontSize: 12, fontWeight: "600" },
  page: { gap: 10, minWidth: 460 },
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  toolbar: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 10,
  },
});
