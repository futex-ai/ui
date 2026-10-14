/**
 * A page without selectable rows for the drag-select stories: a press and a
 * drag inside its provider draw no box.
 */
import { StyleSheet, Text } from "../primitives/reactNative";

import {
  DragSelectableProvider,
  useDragSelectableChanges,
  useSharedUiTheme,
} from "../index";

export function EmptyPageExample() {
  const theme = useSharedUiTheme();
  return (
    <DragSelectableProvider
      style={[styles.emptyPage, { borderColor: theme.colors.border }]}
      testID="empty-page-main"
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.colors.ink }]}
      >
        Dashboard
      </Text>
      <Text style={[styles.body, { color: theme.colors.muted }]}>
        This page has no selectable rows, so a drag here draws no box.
      </Text>
      <EmptyPageStatus />
    </DragSelectableProvider>
  );
}

function EmptyPageStatus() {
  const theme = useSharedUiTheme();
  const state = useDragSelectableChanges(() => undefined);
  return (
    <Text
      style={[styles.statusMeta, { color: theme.colors.muted }]}
      testID="empty-page-status"
    >
      {state.dragging ? "Drag in progress" : "No drag in progress"}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  emptyPage: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 280,
    minWidth: 460,
    padding: 24,
  },
  statusMeta: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
});
