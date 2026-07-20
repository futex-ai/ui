import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar, List, ListItem, Switch } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "List/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type Person = {
  badge?: string;
  detail: string;
  id: string;
  initials: string;
  name: string;
};

const people: Person[] = [
  {
    detail: "Salary · monthly · £1,000.00",
    id: "p1",
    initials: "CM",
    name: "Calum Moore",
  },
  {
    badge: "First full month",
    detail: "Salary · monthly · gross pay needed",
    id: "p2",
    initials: "PP",
    name: "Peter Parker",
  },
  {
    detail: "Salary · monthly · £3,750.00",
    id: "p3",
    initials: "AW",
    name: "Aisha Webb",
  },
];

function personItem(person: Person) {
  return (
    <ListItem
      description={person.detail}
      leading={
        <Avatar decorative label={person.initials} size={42} tone="solid" />
      }
      title={person.name}
      trailing={person.badge ? <Badge label={person.badge} /> : undefined}
    />
  );
}

/**
 * The payroll list from the mockup, fixed: a separator sits between each person
 * and — unlike the buggy mockup — none trails the final row.
 */
export const Payroll: Story = {
  name: "Payroll",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <List<Person>
          accessibilityLabel="People on payroll"
          itemKey={(person) => person.id}
          items={people}
          renderItem={personItem}
        />
      </View>
    </StorySurface>
  ),
};

/** With `separators={false}` the rows stack flush, with no hairline between them. */
export const NoSeparators: Story = {
  name: "No separators",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <List<Person>
          accessibilityLabel="People on payroll"
          itemKey={(person) => person.id}
          items={people}
          renderItem={personItem}
          separators={false}
        />
      </View>
    </StorySurface>
  ),
};

/** `separatorInset` aligns the hairline with the text, past the leading avatar. */
export const InsetSeparators: Story = {
  name: "Inset separators",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <List<Person>
          accessibilityLabel="People on payroll"
          itemKey={(person) => person.id}
          items={people}
          renderItem={personItem}
          separatorInset={70}
        />
      </View>
    </StorySurface>
  ),
};

export const Loading: Story = {
  name: "Loading",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <List<Person>
          accessibilityLabel="People on payroll"
          itemKey={(person) => person.id}
          items={[]}
          loading
          renderItem={personItem}
        />
      </View>
    </StorySurface>
  ),
};

export const ClickableItems: Story = {
  name: "Clickable items",
  render: () => (
    <StorySurface>
      <ClickableExample />
    </StorySurface>
  ),
};

function ClickableExample() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <View style={styles.stack}>
      <Text style={styles.status}>
        {opened
          ? `Opened ${opened}`
          : "Click or focus + Enter a person to open them"}
      </Text>
      <View style={styles.card}>
        <List<Person>
          itemKey={(person) => person.id}
          itemLabel={(person) => `Open ${person.name}`}
          items={people}
          onItemPress={(person) => setOpened(person.name)}
          renderItem={personItem}
        />
      </View>
    </View>
  );
}

export const PressableLabelWithToggle: Story = {
  name: "Pressable label + toggle",
  render: () => (
    <StorySurface>
      <PressableLabelExample />
    </StorySurface>
  ),
};

type SettingRow = { detail: string; id: string; name: string };

const settingRows: SettingRow[] = [
  { detail: "Push, email, and in-app", id: "s1", name: "Notifications" },
  { detail: "Who can see your activity", id: "s2", name: "Visibility" },
  { detail: "Sync across your devices", id: "s3", name: "Backups" },
];

function PressableLabelExample() {
  const [opened, setOpened] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    s1: true,
    s2: false,
    s3: true,
  });
  return (
    <View style={styles.stack}>
      <Text style={styles.status}>
        {opened
          ? `Opened ${opened}`
          : "The label opens the setting; the switch toggles independently"}
      </Text>
      <View style={styles.card}>
        {/* A static list (no `onItemPress`): each ListItem makes only its label
            column pressable, so the trailing Switch stays independently
            interactive in the same row. */}
        <List<SettingRow>
          accessibilityLabel="Settings"
          itemKey={(row) => row.id}
          items={settingRows}
          renderItem={(row) => (
            <ListItem
              description={row.detail}
              onPress={() => setOpened(row.name)}
              title={row.name}
              trailing={
                <Switch
                  accessibilityLabel={`Enable ${row.name}`}
                  onValueChange={(next) =>
                    setEnabled((prev) => ({ ...prev, [row.id]: next }))
                  }
                  value={enabled[row.id] ?? false}
                />
              }
            />
          )}
        />
      </View>
    </View>
  );
}

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <View key={size}>
            <Text style={styles.status}>{size}</Text>
            <View style={styles.card}>
              <List<Person>
                itemKey={(person) => person.id}
                items={people}
                renderItem={(person) => (
                  <ListItem
                    description={person.detail}
                    leading={
                      <Avatar
                        decorative
                        label={person.initials}
                        size={size === "sm" ? 32 : size === "lg" ? 48 : 42}
                        tone="solid"
                      />
                    }
                    size={size}
                    title={person.name}
                  />
                )}
                size={size}
              />
            </View>
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

/** A soft sage pill, matching the mockup's "First full month" tag. */
function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#e3eee6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 520,
  },
  stack: { gap: 12 },
  status: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
});
