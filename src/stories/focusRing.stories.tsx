import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  Button,
  type FocusIndicator,
  Input,
  RadioCard,
  SegmentedControl,
  Switch,
  darkSharedUiTheme,
  useSharedUiTheme,
} from "../index";
import { CallerOwnedIndicatorExample } from "./focusRingCallerOwnedExample";
import {
  RawDomControlExample,
  RawDomOnlyPageExample,
} from "./focusRingRawDomExample";
import { StorySurface } from "./sharedExamples";

/**
 * How controls show keyboard focus is one setting, `focusIndicator`:
 *
 * - **`ring`** (default) — the shared soft glow.
 * - **`outline`** — the browser's default focus outline, on the control's
 *   visible box, so keyboard focus stays visible without the glow.
 * - **`none`** — no focus styling at all: no glow, no outline, no focus
 *   border. Meant for a control embedded in a surface that shows focus itself;
 *   the caller then owns the indicator.
 *
 * Set it for every control on the theme (`StorySurface` forwards the override
 * to the provider), or per instance with the `focusIndicator` prop. Tab
 * through each row to compare the affordances.
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
  name: "Browser outline globally (theme)",
  render: () => (
    <StorySurface theme={{ focusIndicator: "outline" }}>
      <ControlRow caption='theme={{ focusIndicator: "outline" }} — no glow; the browser outline returns.' />
    </StorySurface>
  ),
};

export const RingDisabledPerControl: Story = {
  name: "Browser outline per control (prop)",
  render: () => (
    <StorySurface>
      <ControlRow
        caption='focusIndicator="outline" on each control — same as above, per instance.'
        focusIndicator="outline"
      />
    </StorySurface>
  ),
};

export const NoIndicatorGlobally: Story = {
  name: "No focus indicator globally (theme)",
  render: () => (
    <StorySurface theme={{ focusIndicator: "none" }}>
      <ControlRow caption='theme={{ focusIndicator: "none" }} — no glow, no outline, no focus border.' />
    </StorySurface>
  ),
};

export const NoIndicatorPerControl: Story = {
  name: "No focus indicator per control (prop)",
  render: () => (
    <StorySurface>
      <ControlRow
        caption='focusIndicator="none" on each control — the caller must show focus itself.'
        focusIndicator="none"
      />
    </StorySurface>
  ),
};

export const CallerOwnedIndicator: Story = {
  name: "Caller-owned indicator (none + container focus)",
  render: () => (
    <StorySurface>
      <CallerOwnedIndicatorExample />
    </StorySurface>
  ),
};

export const DynamicDisabled: Story = {
  name: "Dynamic disabled state",
  render: () => (
    <StorySurface>
      <DynamicDisabledExample />
    </StorySurface>
  ),
};

export const RawDomControl: Story = {
  name: "Raw DOM control (focusRingDomProps)",
  render: () => (
    <StorySurface>
      <RawDomControlExample />
    </StorySurface>
  ),
};

export const RawDomOnlyPage: Story = {
  name: "Raw DOM only page (provider injects the CSS)",
  // Deliberately not wrapped in StorySurface: that renders a View, which would
  // inject the stylesheet and hide what this story demonstrates.
  render: () => <RawDomOnlyPageExample />,
};

function DynamicDisabledExample() {
  const [exporting, setExporting] = useState(false);
  return (
    <View style={styles.row}>
      <Button
        disabled={exporting}
        onPress={() => setExporting(true)}
        tone="primary"
      >
        Export
      </Button>
      <Button disabled={!exporting} onPress={() => setExporting(false)}>
        Finish export
      </Button>
      <Button onPress={() => undefined}>Search</Button>
    </View>
  );
}

function ControlRow({
  caption,
  focusIndicator,
}: {
  caption: string;
  focusIndicator?: FocusIndicator;
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
        <Button focusIndicator={focusIndicator} onPress={() => undefined}>
          Save
        </Button>
        <Switch
          accessibilityLabel="Notifications"
          focusIndicator={focusIndicator}
          onValueChange={setOn}
          value={on}
        />
      </View>
      <Input
        focusIndicator={focusIndicator}
        label="Project name"
        onChangeText={setText}
        placeholder="Untitled"
        value={text}
      />
      <SegmentedControl
        accessibilityLabel="Cadence"
        focusIndicator={focusIndicator}
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
          focusIndicator={focusIndicator}
          onPress={() => setRadio("standard")}
          title="Standard"
        />
        <RadioCard
          checked={radio === "priority"}
          focusIndicator={focusIndicator}
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
