/**
 * The small graph primitives: the vertical {@link WorkflowConnector} line, the
 * tinted {@link WorkflowEdgeLabel} transition pill, and the
 * {@link WorkflowLegend} that keys the edge tones. {@link WorkflowBuilder}
 * composes these, but they are exported so a bespoke canvas can be hand-built.
 */
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { resolveEdgeColors } from "./workflowColors";
import {
  createWorkflowStyles,
  workflowSizing,
  type WorkflowStyles,
} from "./workflowStyles";
import type { WorkflowEdgeTone } from "./workflowTypes";

export type WorkflowConnectorProps = {
  /** Match the graph density. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the connector. */
  style?: StyleProp<ViewStyle>;
};

/** The 2px vertical rule that links two spine elements. */
export function WorkflowConnector({
  size = "md",
  style,
}: WorkflowConnectorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  // Purely decorative: the routing is conveyed by the labelled edges and layout.
  // Removed from the accessibility tree on both platforms (native
  // `accessibilityRole="none"` + web `aria-hidden`/`role="none"`), matching the
  // library's other decorative rules (the List separator).
  return (
    <View
      accessibilityRole="none"
      aria-hidden
      role="none"
      style={[styles.connector, style]}
    />
  );
}

export type WorkflowInsertButtonProps = {
  /** Announced name for the button. Defaults to "Add step". */
  accessibilityLabel?: string;
  /** Insert handler, called when the `+` is pressed. */
  onPress: () => void;
  /** Match the graph density. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the button. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A round `+` button that sits on a connector to insert a step between two
 * steps. It carries `button` semantics, the shared focus ring, and the hidden
 * web outline; {@link WorkflowBuilder} renders it in place of the edge labels
 * when it is given an `onInsertStep` handler.
 */
export function WorkflowInsertButton({
  accessibilityLabel = "Add step",
  onPress,
  size = "md",
  style,
}: WorkflowInsertButtonProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const focus = useFocusRing();
  const iconSize = workflowSizing(size).insertIcon;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ hovered }: PressableHoverState) => [
        styles.insertButton,
        hovered ? styles.insertButtonHover : null,
        focus.focused ? styles.insertButtonFocused : null,
        style,
        hideWebOutlineView,
      ]}
    >
      {Platform.OS === "web" ? (
        <Plus aria-hidden color={theme.colors.primaryDeep} size={iconSize} />
      ) : (
        <Plus color={theme.colors.primaryDeep} size={iconSize} />
      )}
    </Pressable>
  );
}

export type WorkflowEdgeLabelProps = {
  /** Override the announced text (defaults to the visible label). */
  accessibilityLabel?: string;
  /** The pill text. */
  children: string;
  /** Match the graph density. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the pill. */
  style?: StyleProp<ViewStyle>;
  /** Semantic tone driving the fill and text color. Defaults to `neutral`. */
  tone?: WorkflowEdgeTone;
};

/**
 * A transition label — the tinted pill sitting between two nodes (`success`,
 * `failure`) or atop a branch (`score ≥ 0.6`). The tone maps onto the theme's
 * accent families ({@link resolveEdgeColors}); the visible text carries the
 * meaning so the color only reinforces it (WCAG 1.4.1).
 */
export function WorkflowEdgeLabel({
  accessibilityLabel,
  children,
  size = "md",
  style,
  tone = "neutral",
}: WorkflowEdgeLabelProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const colors = resolveEdgeColors(theme.colors, tone);
  return (
    <View
      style={[
        styles.edge,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
        style,
      ]}
    >
      <Text
        accessibilityLabel={accessibilityLabel}
        numberOfLines={1}
        style={[styles.edgeText, { color: colors.color }]}
      >
        {children}
      </Text>
    </View>
  );
}

/** One key in a {@link WorkflowLegend}. */
export type WorkflowLegendItem = { label: string; tone: WorkflowEdgeTone };

/** The default legend keys, in the mockup's order. */
export const defaultWorkflowLegend: WorkflowLegendItem[] = [
  { label: "success", tone: "success" },
  { label: "cond", tone: "condition" },
  { label: "failure", tone: "failure" },
  { label: "always", tone: "always" },
];

export type WorkflowLegendProps = {
  /** The keys to show. Defaults to {@link defaultWorkflowLegend}. */
  items?: WorkflowLegendItem[];
  /** Match the graph density. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the legend row. */
  style?: StyleProp<ViewStyle>;
};

/** A centered row of edge-label pills keying the graph's transition tones. */
export function WorkflowLegend({
  items = defaultWorkflowLegend,
  size = "md",
  style,
}: WorkflowLegendProps) {
  const theme = useSharedUiTheme();
  const styles: WorkflowStyles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  return (
    <View
      accessibilityLabel="Edge legend"
      role="list"
      style={[styles.legend, style]}
    >
      {items.map((item) => (
        // The `list` container owns `listitem` children so assistive tech reads
        // it as a keyed list, mirroring the List component's item grouping.
        <View key={item.label} role="listitem">
          <WorkflowEdgeLabel size={size} tone={item.tone}>
            {item.label}
          </WorkflowEdgeLabel>
        </View>
      ))}
    </View>
  );
}
