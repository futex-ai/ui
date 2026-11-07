/**
 * The examples of the touch surface stories: the library controls and list
 * rows inside a `TouchSurface`, as on a phone. Every target is at least 44 by
 * 44px there, whatever the `size` that the example gives.
 */
import { Search, Settings, Tags, X } from "../primitives/icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  Button,
  ComboboxMultiSelect,
  DateField,
  DropdownSelector,
  Input,
  List,
  ListItem,
  SegmentedControl,
  Switch,
} from "../index";
import { TouchSurface } from "../touchSurface";

const environments = [
  { label: "Production", value: "production" },
  { label: "Preview", value: "preview" },
];

const views = [
  { label: "Board", value: "board" },
  { label: "List", value: "list" },
];

const ranges = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
];

const labels = [
  { label: "Design", value: "design" },
  { label: "Billing", value: "billing" },
  { label: "Mobile", value: "mobile" },
];

/**
 * The core controls on a touch surface. Each control asks for the dense `xs`
 * or the `sm` size, and the surface gives it the touch metrics instead. The two
 * 16px icon buttons keep their drawing and reserve a 44px target each.
 */
export function TouchControlsExample() {
  const [presses, setPresses] = useState(0);
  const [query, setQuery] = useState("Invoices");
  const [environment, setEnvironment] = useState("production");
  const [due, setDue] = useState("2026-03-31");
  const [start, setStart] = useState("2026-04-01");
  const [view, setView] = useState("board");
  const [range, setRange] = useState("week");
  const [notify, setNotify] = useState(true);
  const [chosen, setChosen] = useState(["design", "billing"]);
  const [reviewers, setReviewers] = useState(["design", "billing", "mobile"]);
  const press = () => setPresses((count) => count + 1);
  return (
    <TouchSurface>
      <View style={styles.phone}>
        <View style={styles.toolbar}>
          <Button onPress={press} size="xs" tone="primary">
            Save
          </Button>
          <Button
            accessibilityLabel="Settings"
            icon={Settings}
            onPress={press}
            shape="square"
            size="xs"
            tone="plain"
          />
          {/* Drawn 16px faces with a hit slop. On a touch surface they ignore
              the slop and reserve a 44px target each, side by side. */}
          <Button
            accessibilityLabel="Remove filter"
            boxSize={16}
            hitSlop={14}
            icon={X}
            onPress={press}
            shape="circle"
            tone="plain"
          />
          <Button
            accessibilityLabel="Close panel"
            boxSize={16}
            hitSlop={14}
            icon={X}
            onPress={press}
            shape="circle"
            tone="plain"
          />
        </View>
        <Text style={styles.status}>{`Presses: ${presses}`}</Text>
        <Input
          clearable
          label="Search projects"
          onChangeText={setQuery}
          onSuffixIconPress={press}
          prefixIcon={Search}
          size="xs"
          suffixIcon={Tags}
          suffixIconLabel="Filter by tag"
          value={query}
        />
        <DropdownSelector
          label="Environment"
          onValueChange={setEnvironment}
          options={environments}
          size="xs"
          value={environment}
        />
        <DateField label="Due date" onChange={setDue} size="xs" value={due} />
        {/* The wheel variant uses the tap trigger, the one that native uses. */}
        <DateField
          clearable
          label="Start date"
          onChange={setStart}
          size="xs"
          value={start}
          variant="wheel"
        />
        <SegmentedControl
          accessibilityLabel="View"
          onChange={setView}
          options={views}
          size="xs"
          value={view}
        />
        <SegmentedControl
          accessibilityLabel="Range"
          onChange={setRange}
          options={ranges}
          size="xs"
          value={range}
          variant="outline"
        />
        <View style={styles.toolbar}>
          <Switch
            accessibilityLabel="Notifications"
            onValueChange={setNotify}
            size="sm"
            value={notify}
          />
          <Text style={styles.status}>Notifications</Text>
        </View>
        <ComboboxMultiSelect
          label="Labels"
          onChange={setChosen}
          options={labels}
          size="xs"
          values={chosen}
        />
        <ComboboxMultiSelect
          label="Reviewers"
          onChange={setReviewers}
          options={labels}
          singleLine
          size="xs"
          values={reviewers}
        />
      </View>
    </TouchSurface>
  );
}

type Project = { id: string; name: string; detail?: string };

const projects: Project[] = [
  { id: "billing", name: "Billing" },
  { detail: "Updated 2 hours ago", id: "mobile", name: "Mobile app" },
  {
    id: "long",
    name: "A project with a name long enough to wrap onto a second line",
  },
];

/**
 * List rows on a touch surface: a single-line row is 44px high, a longer row
 * grows, and a pressable title spans the row beside an independent switch.
 */
export function TouchRowsExample() {
  const [opened, setOpened] = useState("none");
  const [pinned, setPinned] = useState(false);
  return (
    <TouchSurface>
      <View style={styles.phone}>
        <View style={styles.card}>
          <List<Project>
            accessibilityLabel="Projects"
            itemKey={(project) => project.id}
            items={projects}
            renderItem={(project) => (
              <ListItem
                description={project.detail}
                size="xs"
                title={project.name}
              />
            )}
            size="xs"
          />
        </View>
        <View style={styles.card}>
          <List<string>
            accessibilityLabel="Pinned projects"
            itemKey={(name) => name}
            items={["Deploys"]}
            renderItem={(name) => (
              <ListItem
                onPress={() => setOpened(name)}
                size="xs"
                title={name}
                trailing={
                  <Switch
                    accessibilityLabel={`Pin ${name}`}
                    onValueChange={setPinned}
                    size="sm"
                    value={pinned}
                  />
                }
              />
            )}
            size="xs"
          />
        </View>
        <Text style={styles.status}>{`Opened: ${opened}`}</Text>
        <Text style={styles.status}>{`Pinned: ${pinned ? "yes" : "no"}`}</Text>
      </View>
    </TouchSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  phone: { gap: 12, maxWidth: 360, width: "100%" },
  status: { color: "#4b5450", fontSize: 13, lineHeight: 18 },
  toolbar: { alignItems: "center", flexDirection: "row" },
});
