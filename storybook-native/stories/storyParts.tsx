/**
 * Shared chrome of the native stories: a scrolling page on the theme
 * background, titled sections, and a log line. The stories run no router, so
 * each one writes what a press did into its log.
 */
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useSharedUiTheme } from "@firna/ui/theme";
import { Text } from "@firna/ui/typography";

/** A scrolling story page on the theme background. */
export function StoryScreen({ children }: { children: ReactNode }) {
  const theme = useSharedUiTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.colors.bg }}
    >
      {children}
    </ScrollView>
  );
}

/** A titled group of examples. */
export function StorySection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text variant="overline">{title}</Text>
      {children}
    </View>
  );
}

/** A row of controls that wraps on a narrow screen. */
export function StoryRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** The recent actions of a story, newest last. */
export function useStoryLog() {
  const [entries, setEntries] = useState<string[]>([]);
  return {
    add: (entry: string) =>
      setEntries((current) => [...current.slice(-3), entry]),
    text: entries.length === 0 ? "None yet" : entries.join(", "),
  };
}

/** One line that shows the recent actions of a story. */
export function StoryLog({ label, text }: { label: string; text: string }) {
  return (
    <Text color="secondary" variant="caption">
      {`${label}: ${text}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  screen: { gap: 24, padding: 20 },
  section: { gap: 10 },
});
