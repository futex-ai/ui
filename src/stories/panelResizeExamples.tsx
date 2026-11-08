/**
 * Examples of the panel resize handle. The example layout owns the widths and
 * gives each handle effective bounds that keep room for the main column, as a
 * caller does.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  Button,
  DragSelectableProvider,
  Switch,
  focusRingStyleFor,
  useDragSelectableSelection,
  useDragSelectableTarget,
  useSharedUiTheme,
} from "../index";
import { PanelResizeHandle } from "../panel-resize";

/** Width of the example layout, in px. */
const SHELL_WIDTH = 960;
/** Narrowest the main column gets, in px. */
const MAIN_MIN = 240;

type SaveLog = { last: string; saves: number };

const FILES = ["InvoiceTable.tsx", "useInvoices.ts", "invoices.test.ts"];

/** A file row that a drag selection can select. */
function FileRow({ name }: { name: string }) {
  const theme = useSharedUiTheme();
  const target = useDragSelectableTarget({ id: name, label: name });
  return (
    <View
      {...target.a11yProps}
      ref={target.ref}
      style={[
        styles.file,
        target.selected ? { backgroundColor: theme.colors.primarySoft } : null,
      ]}
    >
      <Text style={styles.fileName}>{name}</Text>
    </View>
  );
}

function FileSelection() {
  const { dragging, selectedCount } = useDragSelectableSelection();
  return (
    <Text style={styles.status}>
      {dragging ? "Selecting files" : `Selected files: ${selectedCount}`}
    </Text>
  );
}

/**
 * A project list before the main column and a changes panel after it, in a
 * page whose files a drag selection can select. A drag, a key, or an
 * accessibility action proposes each width; the layout applies it and stores
 * the width once at the end. A resize drag never starts a selection.
 */
export function PanelsExample() {
  const theme = useSharedUiTheme();
  const [sidebar, setSidebar] = useState(232);
  const [detail, setDetail] = useState(340);
  const [proposals, setProposals] = useState(0);
  const [saved, setSaved] = useState<SaveLog>({ last: "none", saves: 0 });
  const [locked, setLocked] = useState(false);
  const [sidebarShown, setSidebarShown] = useState(true);
  const shownSidebar = sidebarShown ? sidebar : 0;
  const save = (panel: string) => (width: number) =>
    setSaved((log) => ({ last: `${panel} ${width}`, saves: log.saves + 1 }));
  const border = { borderColor: theme.colors.border };
  return (
    <View style={styles.example}>
      <View style={styles.controls}>
        <Switch
          accessibilityLabel="Lock panels"
          onValueChange={setLocked}
          value={locked}
        />
        <Text style={styles.status}>Lock panels</Text>
        <Button onPress={() => setSidebarShown((shown) => !shown)} size="xs">
          {sidebarShown ? "Hide project list" : "Show project list"}
        </Button>
      </View>
      <DragSelectableProvider
        accessibilityLabel="Files"
        selectionLabel={(count) => `${count} file${count === 1 ? "" : "s"}`}
        style={styles.example}
      >
        <View style={[styles.shell, border]}>
          {sidebarShown ? (
            <View style={[styles.sidebar, border, { width: sidebar }]}>
              <Text style={styles.heading}>Projects</Text>
              <PanelResizeHandle
                accessibilityLabel="Resize project list"
                disabled={locked}
                edge="end"
                max={Math.min(360, SHELL_WIDTH - detail - MAIN_MIN)}
                min={200}
                onChange={(width) => {
                  setSidebar(width);
                  setProposals((count) => count + 1);
                }}
                onChangeEnd={save("Project list")}
                value={sidebar}
              />
            </View>
          ) : null}
          <View style={[styles.main, border]}>
            <Text style={styles.heading}>Billing portal</Text>
            {FILES.map((name) => (
              <FileRow key={name} name={name} />
            ))}
          </View>
          <View style={[styles.detail, { width: detail }]}>
            <Text style={styles.heading}>Changes</Text>
            <PanelResizeHandle
              accessibilityLabel="Resize changes panel"
              disabled={locked}
              edge="start"
              max={Math.min(520, SHELL_WIDTH - shownSidebar - MAIN_MIN)}
              min={280}
              onChange={(width) => {
                setDetail(width);
                setProposals((count) => count + 1);
              }}
              onChangeEnd={save("Changes")}
              value={detail}
            />
          </View>
        </View>
        <Text style={styles.status}>
          {`Project list: ${sidebar} px · Changes: ${detail} px`}
        </Text>
        <Text style={styles.status}>
          {`Proposals: ${proposals} · Saves: ${saved.saves} · Last saved: ${saved.last}`}
        </Text>
        <FileSelection />
      </DragSelectableProvider>
    </View>
  );
}

const noop = () => undefined;

/**
 * The handle drawn at rest, under the pointer, during a drag, and with
 * keyboard focus, as static HTML shows them, beside a handle whose focus
 * shows no indicator.
 */
export function HandleStatesExample() {
  const theme = useSharedUiTheme();
  const shownLine = { backgroundColor: theme.colors.border2 };
  const shownGrip = { opacity: 1 };
  const states = [
    { label: "At rest", line: null, grip: null },
    { label: "Under the pointer", line: shownLine, grip: shownGrip },
    { label: "Dragged", line: shownLine, grip: shownGrip },
    {
      label: "Keyboard focus",
      line: shownLine,
      grip: [shownGrip, focusRingStyleFor({ color: theme.colors.primary })],
    },
  ];
  const border = { borderColor: theme.colors.border };
  return (
    <View style={styles.states}>
      {states.map((state) => (
        <View key={state.label} style={[styles.statePanel, border]}>
          <Text style={styles.status}>{state.label}</Text>
          <PanelResizeHandle
            accessibilityLabel={`Resize ${state.label.toLowerCase()} panel`}
            edge="end"
            gripStyle={state.grip}
            lineStyle={state.line}
            max={360}
            min={200}
            onChange={noop}
            value={232}
          />
        </View>
      ))}
      <View style={[styles.statePanel, border]}>
        <Text style={styles.status}>No focus indicator</Text>
        <PanelResizeHandle
          accessibilityLabel="Resize panel without a focus indicator"
          edge="end"
          focusIndicator="none"
          max={360}
          min={200}
          onChange={noop}
          value={232}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { alignItems: "center", flexDirection: "row", gap: 8 },
  // The changes panel follows the main column, whose end border is the line
  // between them, so no panel draws a border on its start edge.
  detail: { gap: 8, padding: 12 },
  example: { gap: 12 },
  file: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  fileName: { color: "#1f2a24", fontSize: 13, lineHeight: 18 },
  heading: { color: "#1f2a24", fontSize: 13, fontWeight: "600" },
  main: { borderRightWidth: 1, flex: 1, gap: 8, padding: 12 },
  shell: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 240,
    width: SHELL_WIDTH,
  },
  // The end-edge handle reaches past the panel, so the panel sits above the
  // main column that follows it.
  sidebar: { borderRightWidth: 1, gap: 8, padding: 12, zIndex: 1 },
  states: { flexDirection: "row", gap: 24 },
  statePanel: { borderRightWidth: 1, height: 120, padding: 8, width: 140 },
  status: { color: "#4b5450", fontSize: 13, lineHeight: 18 },
});
