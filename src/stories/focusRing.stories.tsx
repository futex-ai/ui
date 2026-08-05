import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  Input,
  RadioCard,
  SegmentedControl,
  Switch,
  darkSharedUiTheme,
  useSharedUiTheme,
} from "../index";
import { StorySurface } from "./sharedExamples";

/**
 * The shared focus glow can be turned off two ways:
 *
 * - **Globally** — set `focusRing: false` on the theme (`StorySurface` forwards
 *   it to the provider). Every control drops the glow at once and falls back to
 *   the browser's default focus outline, so keyboard focus stays visible.
 * - **Per control** — pass `disableFocusRing` to a single component; only that
 *   instance loses the glow.
 *
 * Tab through each row to compare the affordances.
 */
const meta = {
  title: "Focus ring/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const RingEnabledDefault: Story = {
  name: "Ring enabled (default)",
  render: () => (
    <StorySurface>
      <ControlRow caption="Default theme — Tab to see the soft focus glow." />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <ControlRow caption="Dark theme — Tab to see the soft focus glow." />
    </StorySurface>
  ),
};

export const RingDisabledGlobally: Story = {
  name: "Ring disabled globally (theme flag)",
  render: () => (
    <StorySurface theme={{ focusRing: false }}>
      <ControlRow caption="theme={{ focusRing: false }} — no glow; the UA outline returns." />
    </StorySurface>
  ),
};

export const RingDisabledPerControl: Story = {
  name: "Ring disabled per control (prop)",
  render: () => (
    <StorySurface>
      <ControlRow
        caption="disableFocusRing on each control — same as above, but opt-in per instance."
        disableFocusRing
      />
    </StorySurface>
  ),
};

function ControlRow({
  caption,
  disableFocusRing = false,
}: {
  caption: string;
  disableFocusRing?: boolean;
}) {
  const [on, setOn] = useState(true);
  const [choice, setChoice] = useState("weekly");
  const [text, setText] = useState("");
  const [radio, setRadio] = useState("standard");
  // The caption reads from the theme so this row composes under any preset.
  const theme = useSharedUiTheme();
  return (
    <View style={styles.column}>
      <Text style={[styles.caption, { color: theme.colors.muted }]}>
        {caption}
      </Text>
      <View style={styles.row}>
        <Button disableFocusRing={disableFocusRing} onPress={() => undefined}>
          Save
        </Button>
        <Switch
          accessibilityLabel="Notifications"
          disableFocusRing={disableFocusRing}
          onValueChange={setOn}
          value={on}
        />
      </View>
      <Input
        disableFocusRing={disableFocusRing}
        label="Project name"
        onChangeText={setText}
        placeholder="Untitled"
        value={text}
      />
      <SegmentedControl
        accessibilityLabel="Cadence"
        disableFocusRing={disableFocusRing}
        onChange={setChoice}
        options={[
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
        ]}
        value={choice}
      />
      <View style={styles.row}>
        <RadioCard
          checked={radio === "standard"}
          disableFocusRing={disableFocusRing}
          onPress={() => setRadio("standard")}
          title="Standard"
        />
        <RadioCard
          checked={radio === "priority"}
          disableFocusRing={disableFocusRing}
          onPress={() => setRadio("priority")}
          title="Priority"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 13,
  },
  column: {
    gap: 16,
    maxWidth: 420,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
});
