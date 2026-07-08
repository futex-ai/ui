/** The grid's footer strip: record counts and view summary text. */
import { Text, View } from "react-native";

import type { DataGridStyles } from "./dataGridStyles";

export function DataGridFooter({
  footerText,
  styles,
}: {
  footerText: string;
  styles: DataGridStyles;
}) {
  // Split on the middot so each clause reads as its own footer item, matching
  // the mockup ("7 of 128 records · 0 filters · sorted by Created ↓").
  const parts = footerText
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <View style={styles.footer}>
      {parts.map((part, index) => (
        <Text key={`${part}-${index}`} style={styles.footerText}>
          {part}
        </Text>
      ))}
    </View>
  );
}
