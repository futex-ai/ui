import type { Meta, StoryObj } from "@storybook/react-native";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { PanelResizeHandle } from "@firna/ui/panel-resize";
import { useSharedUiTheme } from "@firna/ui/theme";
import { Text } from "@firna/ui/typography";

import { StoryLog, StoryScreen, StorySection } from "./storyParts";

/** A side panel with its title and width. The caller owns the width. */
function Panel(props: { children: ReactNode; title: string; width: number }) {
  const theme = useSharedUiTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.bg, width: props.width },
      ]}
    >
      <Text variant="label">{props.title}</Text>
      <Text color="muted" variant="caption">{`${props.width} px`}</Text>
      {props.children}
    </View>
  );
}

/**
 * A project list and a changes panel around the main content. Drag a handle,
 * or use the increment and decrement actions of a screen reader. Each width
 * stays within its bounds, and the end of each change is stored once.
 */
function PanelsExample() {
  const theme = useSharedUiTheme();
  const [list, setList] = useState(140);
  const [changes, setChanges] = useState(120);
  const [stored, setStored] = useState("None yet");
  const divider = { borderColor: theme.colors.border };
  return (
    <StoryScreen>
      <View style={[styles.columns, divider]}>
        <View style={[styles.divided, styles.front, divider]}>
          <Panel title="Projects" width={list}>
            <PanelResizeHandle
              accessibilityLabel="Resize the project list"
              edge="end"
              max={220}
              min={100}
              onChange={setList}
              onChangeEnd={(width) => setStored(`Project list, ${width} px`)}
              value={list}
            />
          </Panel>
        </View>
        <View style={[styles.main, styles.divided, divider]}>
          <Text>Main content</Text>
        </View>
        <Panel title="Changes" width={changes}>
          <PanelResizeHandle
            accessibilityLabel="Resize the changes panel"
            edge="start"
            max={200}
            min={96}
            onChange={setChanges}
            onChangeEnd={(width) => setStored(`Changes panel, ${width} px`)}
            value={changes}
          />
        </Panel>
      </View>
      <StoryLog label="Stored width" text={stored} />
    </StoryScreen>
  );
}

/**
 * The handle states, drawn with `lineStyle` and `gripStyle`: at rest, during
 * a drag, and turned off. Native has no pointer hover or keyboard focus.
 */
function HandleStatesExample() {
  const theme = useSharedUiTheme();
  const line = { backgroundColor: theme.colors.border2 };
  const grip = { opacity: 1 };
  const states = [
    { name: "At rest" },
    { gripStyle: grip, lineStyle: line, name: "Dragged" },
    { disabled: true, name: "Turned off" },
  ];
  return (
    <StoryScreen>
      {states.map((state) => (
        <StorySection key={state.name} title={state.name}>
          <View
            style={[
              styles.columns,
              styles.short,
              { borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.divided,
                styles.front,
                { borderColor: theme.colors.border },
              ]}
            >
              <Panel title="Projects" width={160}>
                <PanelResizeHandle
                  accessibilityLabel={`Resize the project list, ${state.name}`}
                  disabled={state.disabled}
                  edge="end"
                  gripStyle={state.gripStyle}
                  lineStyle={state.lineStyle}
                  max={220}
                  min={100}
                  onChange={() => undefined}
                  value={160}
                />
              </Panel>
            </View>
            <View style={styles.main} />
          </View>
        </StorySection>
      ))}
    </StoryScreen>
  );
}

const meta: Meta = { title: "Panel resize/Native handle" };

export default meta;

type Story = StoryObj;

export const Panels: Story = { render: () => <PanelsExample /> };
export const HandleStates: Story = { render: () => <HandleStatesExample /> };

const styles = StyleSheet.create({
  // Each column divider is the right border of the column before it.
  columns: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    height: 320,
    overflow: "hidden",
  },
  divided: { borderRightWidth: 1 },
  // The handle reaches past the panel edge, so its column draws above the
  // main column that follows it.
  front: { zIndex: 1 },
  main: { alignItems: "center", flex: 1, justifyContent: "center" },
  panel: { flex: 1, gap: 4, padding: 12 },
  short: { height: 140 },
});
