import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Rocket, Search, Settings } from "lucide-react-native";

import { Button } from "@firna/ui/button";
import { DateField } from "@firna/ui/date";
import { DropdownSelector } from "@firna/ui/dropdown";
import { Input } from "@firna/ui/input";
import { SegmentedControl } from "@firna/ui/segmented";
import { Switch } from "@firna/ui/switch";
import { TouchSurface, useTouchSurface } from "@firna/ui/touch-surface";
import { Text } from "@firna/ui/typography";

import {
  StoryLog,
  StoryRow,
  StoryScreen,
  StorySection,
  useStoryLog,
} from "./storyParts";

const branches = [
  { label: "main", value: "main" },
  { label: "release", value: "release" },
];

const visibilities = [
  { label: "Private", value: "private" },
  { label: "Team", value: "team" },
  { label: "Public", value: "public" },
] as const;

type Visibility = (typeof visibilities)[number]["value"];

/**
 * The same controls at the dense `xs` size. Outside a touch surface they are
 * 26 px high. Inside one, each target is at least 44 by 44 px.
 */
function DenseControls() {
  const touch = useTouchSurface();
  const [query, setQuery] = useState("Billing");
  const [branch, setBranch] = useState("main");
  const [visibility, setVisibility] = useState<Visibility>("team");
  const [notify, setNotify] = useState(true);
  const [date, setDate] = useState("2026-11-08");
  const log = useStoryLog();
  return (
    <View style={styles.controls}>
      <StoryLog label="Touch surface" text={touch ? "on" : "off"} />
      <StoryRow>
        <Button
          icon={Rocket}
          onPress={() => log.add("Deploy")}
          size="xs"
          tone="primary"
        >
          Deploy
        </Button>
        <Button onPress={() => log.add("Share")} size="xs">
          Share
        </Button>
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          onPress={() => log.add("Settings")}
          shape="square"
          size="xs"
          tone="plain"
        />
      </StoryRow>
      <Input
        accessibilityLabel="Search projects"
        clearable
        onChangeText={setQuery}
        placeholder="Search projects"
        prefixIcon={Search}
        size="xs"
        value={query}
      />
      <DropdownSelector
        label="Default branch"
        onValueChange={setBranch}
        options={branches}
        size="xs"
        value={branch}
      />
      <SegmentedControl
        accessibilityLabel="Visibility"
        onChange={setVisibility}
        options={visibilities}
        size="xs"
        value={visibility}
      />
      <StoryRow>
        <Switch
          accessibilityLabel="Email me when a deploy fails"
          onValueChange={setNotify}
          size="xs"
          value={notify}
        />
        <Text>Email me when a deploy fails</Text>
      </StoryRow>
      <DateField
        label="Release date"
        onChange={setDate}
        size="xs"
        value={date}
      />
      <StoryLog label="Last action" text={log.text} />
    </View>
  );
}

/** Dense controls, then the same controls on a touch surface. */
function ControlsExample() {
  return (
    <StoryScreen>
      <StorySection title="Dense surface">
        <DenseControls />
      </StorySection>
      <TouchSurface>
        <StorySection title="Touch surface">
          <DenseControls />
        </StorySection>
      </TouchSurface>
    </StoryScreen>
  );
}

/** A region inside a touch surface that returns to the dense metrics. */
function NestedRegionExample() {
  return (
    <TouchSurface>
      <StoryScreen>
        <StorySection title="Touch surface">
          <DenseControls />
        </StorySection>
        <TouchSurface enabled={false}>
          <StorySection title="Dense region inside it">
            <DenseControls />
          </StorySection>
        </TouchSurface>
      </StoryScreen>
    </TouchSurface>
  );
}

const meta: Meta = { title: "Touch surface/Native controls" };

export default meta;

type Story = StoryObj;

export const Controls: Story = { render: () => <ControlsExample /> };
export const NestedRegion: Story = { render: () => <NestedRegionExample /> };

const styles = StyleSheet.create({ controls: { gap: 12 } });
