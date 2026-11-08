import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Avatar, List, ListItem, darkSharedUiTheme } from "../index";
import { ListDenseRowsExample } from "./listDenseRowsExample";
import { ListNavigationRowsExample } from "./listNavigationRowsExample";
import { ListCard, people, personItem, type Person } from "./listPeople";
import { PressableLabelExample } from "./listPressableLabelExample";
import { ListRepositoryPickerExample } from "./listRepositoryPickerExample";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "List/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

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
export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <ListCard>
        <List<Person>
          accessibilityLabel="People on payroll"
          itemKey={(person) => person.id}
          items={people}
          renderItem={personItem}
        />
      </ListCard>
    </StorySurface>
  ),
};

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

export const RepositoryPickerRegression: Story = {
  name: "Repository picker regression",
  parameters: {
    docs: {
      description: {
        story:
          "Consumer-shaped regression fixture: a modal containing a static List whose rich ListItem title is pressable beside a decorative chevron.",
      },
    },
  },
  render: () => (
    <StorySurface>
      <ListRepositoryPickerExample />
    </StorySurface>
  ),
};

/** Dense `xs` rows: 26px for one line, taller for longer content. */
export const DenseRows: Story = {
  name: "Dense rows",
  render: () => (
    <StorySurface>
      <ListDenseRowsExample />
    </StorySurface>
  ),
};

/**
 * Navigation rows: links inside their list items, with the current page
 * tinted and a row that opens a page outside the app in a new tab.
 */
export const NavigationRows: Story = {
  name: "Navigation rows",
  render: () => (
    <StorySurface>
      <ListNavigationRowsExample />
    </StorySurface>
  ),
};

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

const styles = StyleSheet.create({
  card: {
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
