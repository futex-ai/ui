import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { useFocusRing, useSharedUiTheme } from "../index";

/**
 * A hand-rolled control on a web-only consumer has no Firna primitive to spread
 * `focusRingProps` on, so the hook also spells its markers as literal `data-*`
 * attributes. Both elements below are plain DOM: the swatch paints itself
 * (`focusRingDomProps`), and the field paints its frame while the inner input
 * (`focusTargetDomProps`) owns focus — the same split `Input` uses.
 */
export function RawDomControlExample() {
  const theme = useSharedUiTheme();
  const [value, setValue] = useState("Quarterly report");
  return (
    <View style={styles.column}>
      <Text style={[styles.caption, { color: theme.colors.muted }]}>
        Plain DOM elements — Tab to see the same glow via focusRingDomProps.
      </Text>
      <View style={styles.row}>
        <RawSwatch color={theme.colors.primary} label="Sage swatch" />
        <RawField label="Raw DOM field" onChange={setValue} value={value} />
      </View>
    </View>
  );
}

function RawSwatch({ color, label }: { color: string; label: string }) {
  const focus = useFocusRing();
  return (
    <button
      {...focus.focusRingDomProps}
      aria-label={label}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      style={{
        backgroundColor: color,
        border: 0,
        borderRadius: 8,
        cursor: "pointer",
        height: 32,
        padding: 0,
        width: 32,
        ...focus.focusRingVariables,
      }}
      type="button"
    />
  );
}

function RawField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const theme = useSharedUiTheme();
  const focus = useFocusRing({ target: "descendant" });
  return (
    <div
      {...focus.focusRingDomProps}
      aria-label={label}
      role="group"
      style={{
        alignItems: "center",
        border: `1px solid ${theme.colors.controlBorder}`,
        borderRadius: 8,
        display: "flex",
        height: 40,
        padding: "0 12px",
        ...focus.focusRingVariables,
      }}
    >
      <input
        {...focus.focusTargetDomProps}
        aria-label={label}
        onBlur={focus.onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={focus.onFocus}
        style={{
          background: "transparent",
          border: 0,
          color: theme.colors.ink,
          font: "inherit",
          padding: 0,
          width: 160,
        }}
        value={value}
      />
    </div>
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
