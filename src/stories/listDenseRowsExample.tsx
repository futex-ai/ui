/**
 * Dense `xs` list rows for a desktop sidebar: a single-line row is 26px high,
 * a longer row grows with its content, and a pressable title spans the row
 * beside an independent trailing action.
 */
import { Pin } from "../primitives/icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Button, List, ListItem } from "../index";

type Project = { count: number; id: string; name: string };

const projects: Project[] = [
  { count: 12, id: "billing", name: "Billing" },
  { count: 4, id: "mobile", name: "Mobile app" },
  {
    count: 1,
    id: "long",
    name: "A project with a name long enough to wrap onto a second line",
  },
];

export function ListDenseRowsExample() {
  const [opened, setOpened] = useState("none");
  const [pinned, setPinned] = useState(false);
  return (
    <View style={styles.stack}>
      <View style={styles.sidebar}>
        <List<Project>
          accessibilityLabel="Projects"
          itemKey={(project) => project.id}
          items={projects}
          renderItem={(project) => (
            <ListItem
              size="xs"
              title={project.name}
              trailing={<Text style={styles.count}>{project.count}</Text>}
            />
          )}
          separators={false}
          size="xs"
        />
      </View>
      <View style={styles.sidebar}>
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
                <Button
                  accessibilityLabel={`Pin ${name}`}
                  icon={Pin}
                  onPress={() => setPinned((current) => !current)}
                  shape="square"
                  size="xs"
                  tone="plain"
                />
              }
            />
          )}
          separators={false}
          size="xs"
        />
      </View>
      {/* A loading dense list draws single-line placeholders, as high as its
          rows. */}
      <View style={styles.sidebar}>
        <List<Project>
          accessibilityLabel="Loading projects"
          itemKey={(project) => project.id}
          items={[]}
          loading
          loadingItemCount={3}
          renderItem={(project) => <ListItem size="xs" title={project.name} />}
          separators={false}
          size="xs"
        />
      </View>
      <Text style={styles.status}>{`Opened: ${opened}`}</Text>
      <Text style={styles.status}>{`Pinned: ${pinned ? "yes" : "no"}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  count: { color: "#6b7280", fontSize: 12, lineHeight: 16 },
  sidebar: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    width: 232,
  },
  stack: { gap: 12 },
  status: { color: "#4b5450", fontSize: 13, lineHeight: 18 },
});
