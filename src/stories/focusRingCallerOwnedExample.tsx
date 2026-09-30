import { useState } from "react";
import { Search } from "../primitives/icons";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Button, InputFrame, useSharedUiTheme } from "../index";

/**
 * `focusIndicator="none"` is for a control that sits inside a surface which
 * already shows focus. Here the search bar owns the indicator: the embedded
 * field paints no glow, outline, or focus border of its own, and the bar
 * thickens its border in the primary color while the field is focused, so
 * keyboard focus stays visible (WCAG 2.1 — 2.4.7). The Go button keeps the
 * default ring, since the bar says nothing about it.
 */
export function CallerOwnedIndicatorExample() {
  const theme = useSharedUiTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.column}>
      <Text style={[styles.caption, { color: theme.colors.muted }]}>
        The bar shows focus, so the embedded field opts out with
        focusIndicator=&quot;none&quot;.
      </Text>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: focused ? theme.colors.primary : theme.colors.border2,
            borderRadius: theme.radii.lg,
          },
          focused ? styles.barFocused : null,
        ]}
      >
        <InputFrame
          accessibilityLabel="Search projects"
          clearable
          focusIndicator="none"
          onBlur={() => setFocused(false)}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder="Search projects"
          prefixIcon={Search}
          style={styles.field}
          value={query}
          variant="plain"
        />
        <Button onPress={() => undefined} size="sm" tone="primary">
          Go
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  barFocused: {
    // One extra pixel of border, taken back from the padding so the content
    // does not shift when focus arrives.
    borderWidth: 2,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  caption: {
    fontSize: 13,
  },
  column: {
    gap: 16,
    maxWidth: 420,
  },
  field: {
    flex: 1,
  },
});
