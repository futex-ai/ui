/**
 * The app-shell example for the drag-select stories: one provider is the
 * scrolling main column around every page, beside a sidebar that sits outside
 * it. The provider is off by default, and each page turns it on with
 * `useDragSelectableOptions`. The sidebar switches between two pages with
 * different row ids.
 */
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "../primitives/reactNative";

import {
  Button,
  DragSelectableProvider,
  Switch,
  useDragSelectableChanges,
  useDragSelectableOptions,
  useSharedUiTheme,
} from "../index";
import type { DragSelectableSelection } from "../index";
import {
  rowCountLabel,
  shellInvoices,
  shellTransactions,
  ShellRowView,
} from "./dragSelectShellRow";
import { InvoiceTools } from "./dragSelectShellTools";

type ShellPage = "transactions" | "invoices";

const pageCopy: Record<ShellPage, { body: string; title: string }> = {
  invoices: {
    body: "Invoices sent this quarter. Drag across rows to select them.",
    title: "Invoices",
  },
  transactions: {
    body: "Bank transactions for this month. Drag across rows to select them, or open one to see its details.",
    title: "Transactions",
  },
};

/** Counts the provider's `onSelectionChange` calls for the status line. */
type SelectionLog = { calls: number; lastIds: string };

export function PageShellExample() {
  const theme = useSharedUiTheme();
  const { height } = useWindowDimensions();
  const [page, setPage] = useState<ShellPage>("transactions");
  const [opened, setOpened] = useState("none");
  const [log, setLog] = useState<SelectionLog>({ calls: 0, lastIds: "none" });
  const [keepTextSelection, setKeepTextSelection] = useState(false);
  const onSelectionChange = (selection: DragSelectableSelection) =>
    setLog((current) => ({
      calls: current.calls + 1,
      lastIds: selection.selectedIds.join(", ") || "none",
    }));
  return (
    <View style={[styles.app, { backgroundColor: theme.colors.bg, height }]}>
      <View
        style={[styles.sidebar, { borderRightColor: theme.colors.border }]}
        testID="page-shell-sidebar"
      >
        <Text style={[styles.brand, { color: theme.colors.ink }]}>Ledger</Text>
        <Text style={[styles.sidebarCopy, { color: theme.colors.muted }]}>
          Books for Greenhouse Studio
        </Text>
        {(["transactions", "invoices"] as const).map((key) => (
          <Button
            block
            key={key}
            onPress={() => setPage(key)}
            size="sm"
            tone={page === key ? "primary" : "ghost"}
          >
            {pageCopy[key].title}
          </Button>
        ))}
        <View style={styles.setting}>
          <Text
            nativeID="keep-text-selection-label"
            style={[styles.settingLabel, { color: theme.colors.ink }]}
          >
            Highlight text while dragging
          </Text>
          <Switch
            aria-labelledby="keep-text-selection-label"
            onValueChange={setKeepTextSelection}
            size="sm"
            testID="page-shell-keep-text"
            value={keepTextSelection}
          />
        </View>
      </View>
      <DragSelectableProvider
        disabled
        onSelectionChange={onSelectionChange}
        selectionLabel={(count) => rowCountLabel(count)}
        style={[styles.main, webScrollColumn]}
        testID="page-shell-main"
      >
        <ShellPage
          keepTextSelection={keepTextSelection}
          key={page}
          log={log}
          onOpen={setOpened}
          opened={opened}
          page={page}
        />
      </DragSelectableProvider>
    </View>
  );
}

function ShellPage({
  keepTextSelection,
  log,
  onOpen,
  opened,
  page,
}: {
  keepTextSelection: boolean;
  log: SelectionLog;
  onOpen: (id: string) => void;
  opened: string;
  page: ShellPage;
}) {
  const theme = useSharedUiTheme();
  useDragSelectableOptions({
    disabled: false,
    preventTextSelection: !keepTextSelection,
  });
  const pageRows = page === "transactions" ? shellTransactions : shellInvoices;
  return (
    <View style={styles.content} testID="page-shell-content">
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.colors.ink }]}
      >
        {pageCopy[page].title}
      </Text>
      <Text style={[styles.body, { color: theme.colors.muted }]}>
        {pageCopy[page].body}
      </Text>
      <ShellStatus log={log} opened={opened} />
      <View
        style={[
          styles.list,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {pageRows.map((row) => (
          <ShellRowView key={row.id} onOpen={onOpen} row={row} />
        ))}
      </View>
      {page === "invoices" ? <InvoiceTools /> : null}
    </View>
  );
}

function ShellStatus({ log, opened }: { log: SelectionLog; opened: string }) {
  const theme = useSharedUiTheme();
  const state = useDragSelectableChanges(() => undefined);
  const color = { color: theme.colors.muted };
  return (
    <View style={styles.status} testID="page-shell-status">
      <Text style={[styles.statusTitle, { color: theme.colors.ink }]}>
        Selected {rowCountLabel(state.selectedCount)}
      </Text>
      <Text style={[styles.statusMeta, color]}>
        {state.dragging
          ? `Matching ${rowCountLabel(state.matchingCount)}`
          : `Selection changes: ${log.calls}. Last: ${log.lastIds}`}
      </Text>
      <Text style={[styles.statusMeta, color]}>Opened: {opened}</Text>
    </View>
  );
}

const webScrollColumn = {
  overflowX: "hidden",
  overflowY: "auto",
} as unknown as ViewStyle;

const styles = StyleSheet.create({
  app: { flexDirection: "row", width: "100%" },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: "800" },
  content: {
    alignSelf: "center",
    maxWidth: 560,
    paddingHorizontal: 16,
    paddingVertical: 24,
    width: "100%",
  },
  list: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  main: { flex: 1 },
  sidebar: { borderRightWidth: 1, gap: 8, padding: 16, width: 200 },
  setting: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 16,
  },
  settingLabel: { flex: 1, fontSize: 12, fontWeight: "600" },
  sidebarCopy: { fontSize: 12, marginBottom: 8 },
  status: { gap: 2, marginBottom: 12 },
  statusMeta: { fontSize: 12, fontWeight: "600" },
  statusTitle: { fontSize: 14, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
});
