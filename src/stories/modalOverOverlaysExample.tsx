/** Dialogs opened over overlays that stay open, for the web modal stack tests. */
import { useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import {
  Body,
  Button,
  DropdownMenu,
  Input,
  Popover,
  WebModalFrame,
} from "../index";
import type { DropdownListEntry } from "../index";

/**
 * A page with two overlays that stay open while a dialog opens over them: a
 * column menu that stays open after a selection, and a filters popover that
 * renders its save dialog inside its own content. Each overlay is background
 * while its dialog is open, so the dialog's typing and presses belong to the
 * dialog alone.
 */
export function ModalOverOverlaysExample() {
  const [showTotals, setShowTotals] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [viewName, setViewName] = useState("");

  const columnEntries: DropdownListEntry[] = [
    {
      id: "totals",
      label: "Show totals",
      onPress: () => setShowTotals((shown) => !shown),
      selected: showTotals,
      type: "item",
    },
    {
      id: "add-column",
      label: "Add column…",
      onPress: () => {
        setColumnName("");
        setAddingColumn(true);
      },
      type: "item",
    },
  ];

  return (
    <View style={styles.page}>
      <DropdownMenu
        accessibilityLabel="Column options"
        closeOnSelect={false}
        entries={columnEntries}
        minWidth={200}
      >
        {({ open, triggerProps }) => (
          <Button
            expanded={open}
            hasPopup="menu"
            onPress={triggerProps.onPress}
          >
            Columns
          </Button>
        )}
      </DropdownMenu>
      <Popover
        label="Filters"
        minWidth={260}
        trigger={({ open, triggerProps }) => (
          <Button
            expanded={open}
            hasPopup="dialog"
            onPress={triggerProps.onPress}
          >
            Filters
          </Button>
        )}
      >
        <View style={styles.filters}>
          <Body>Showing paid invoices from March.</Body>
          <Button hasPopup="dialog" onPress={() => setSavingView(true)}>
            Save as view…
          </Button>
          <WebModalFrame
            footer={
              <Button onPress={() => setSavingView(false)} tone="primary">
                Save
              </Button>
            }
            onClose={() => setSavingView(false)}
            size="sm"
            title="Save view"
            visible={savingView}
          >
            <Input
              label="View name"
              onChangeText={setViewName}
              value={viewName}
            />
          </WebModalFrame>
        </View>
      </Popover>
      <WebModalFrame
        footer={
          <Button onPress={() => setAddingColumn(false)} tone="primary">
            Add
          </Button>
        }
        onClose={() => setAddingColumn(false)}
        size="sm"
        title="Add column"
        visible={addingColumn}
      >
        <Input
          label="Column name"
          onChangeText={setColumnName}
          value={columnName}
        />
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, padding: 12 },
  page: { flexDirection: "row", gap: 12 },
});
