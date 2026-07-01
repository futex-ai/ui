/**
 * A single executable step card — the colored type chip, the uppercase category
 * label and title, and an optional run-status dot. Becomes a pressable button
 * (with the shared hover / focus-ring / pressed treatment) when given an
 * `onPress`, and shows the selected ring when it is the actively-edited node.
 */
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useReducedMotion } from "../useReducedMotion";
import { useSharedUiTheme } from "../theme";

import { resolveStatusColor } from "./workflowColors";
import { createWorkflowStyles, workflowSizing } from "./workflowStyles";
import {
  defaultWorkflowNodeColors,
  defaultWorkflowNodeIcons,
  type WorkflowNodeData,
  type WorkflowNodeStatus,
} from "./workflowTypes";

/** Spoken text for each run status, so the dot is not a color-only signal. */
const STATUS_LABELS: Record<WorkflowNodeStatus, string> = {
  error: "Error",
  ok: "Completed",
  running: "Running",
  skipped: "Skipped",
  waiting: "Waiting",
};

export type WorkflowStatusDotProps = {
  /**
   * Hide the dot from assistive technology. Set this when it sits inside a node
   * whose own accessible name already states the status, so the status is not
   * announced twice; standalone, leave it `false` so the dot names itself.
   */
  decorative?: boolean;
  /** Match the graph density. Defaults to `md`. */
  size?: ControlSize;
  /** The run status to show. */
  status: WorkflowNodeStatus;
};

export type WorkflowNodeProps = {
  /** Override the announced name of a pressable node (defaults to `type: name` plus any status). */
  accessibilityLabel?: string;
  /** Override the type chip's fill (defaults to the type's category color). */
  color?: string;
  /** The node data to render. */
  node: WorkflowNodeData;
  /** Press handler; providing it makes the card a pressable button. */
  onPress?: (node: WorkflowNodeData) => void;
  /** Show the selected ring (the actively-edited node). */
  selected?: boolean;
  /** Control density. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the card container. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The colored, gently-pulsing status dot with a spoken status alternative. The
 * `running` dot pulses its opacity (through the native driver off web, matching
 * the {@link Spinner}) unless the user prefers reduced motion. Pass `decorative`
 * to mute its announcement when the surrounding node already names the status.
 */
export function WorkflowStatusDot({
  decorative = false,
  size = "md",
  status,
}: WorkflowStatusDotProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const animate = status === "running" && !reduceMotion;

  useEffect(() => {
    if (!animate) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.35,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : STATUS_LABELS[status]}
      accessibilityRole={decorative ? undefined : "image"}
      aria-hidden={decorative || undefined}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      style={[
        styles.statusDot,
        { backgroundColor: resolveStatusColor(theme.colors, status) },
        animate ? { opacity: pulse } : null,
      ]}
    />
  );
}

/** The step card. See {@link WorkflowNodeProps}. */
export function WorkflowNode({
  accessibilityLabel,
  color,
  node,
  onPress,
  selected = false,
  size = "md",
  style,
}: WorkflowNodeProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const focus = useFocusRing();
  const Icon = node.icon ?? defaultWorkflowNodeIcons[node.type];
  const chipColor = color ?? defaultWorkflowNodeColors[node.type];
  const iconSize = workflowSizing(size).chipIcon;
  const typeLabel = node.typeLabel ?? node.type;
  const label =
    accessibilityLabel ??
    `${typeLabel}: ${node.name}${
      node.status ? `, ${STATUS_LABELS[node.status]}` : ""
    }`;

  // `dotDecorative` mutes the status dot's own announcement when the card is a
  // pressable button — the button's name already includes the status. A plain
  // (non-pressable) card carries no grouped name, so its dot names itself and
  // the visible text announces naturally, mirroring the Table's static rows.
  const body = (dotDecorative: boolean) => (
    <>
      <View style={[styles.chip, { backgroundColor: chipColor }]}>
        {Platform.OS === "web" ? (
          <Icon aria-hidden color="#fff" size={iconSize} />
        ) : (
          <Icon color="#fff" size={iconSize} />
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.typeText}>
          {typeLabel}
        </Text>
        <Text numberOfLines={1} style={styles.nameText}>
          {node.name}
        </Text>
      </View>
      {node.status ? (
        <WorkflowStatusDot
          decorative={dotDecorative}
          size={size}
          status={node.status}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={() => onPress(node)}
        style={({ hovered, pressed }: PressableHoverState) => [
          styles.node,
          styles.nodePressable,
          node.dim ? styles.nodeDim : null,
          hovered ? styles.nodeHover : null,
          pressed ? styles.nodePressed : null,
          selected ? styles.nodeSelected : null,
          focus.focused && !selected ? styles.nodeFocused : null,
          style,
          hideWebOutlineView,
        ]}
      >
        {body(true)}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.node,
        node.dim ? styles.nodeDim : null,
        selected ? styles.nodeSelected : null,
        style,
      ]}
    >
      {body(false)}
    </View>
  );
}
