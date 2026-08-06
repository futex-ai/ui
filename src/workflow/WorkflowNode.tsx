/**
 * A single executable step card — the colored type chip, the uppercase category
 * label and title, and an optional run-status dot. Becomes a pressable button
 * (with the shared hover / focus-ring / pressed treatment) when given an
 * `onPress`, and shows the selected ring when it is the actively-edited node.
 */
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { PressableHoverState, useFocusRing } from "../focusRing";
import { StatusDot } from "../status-dot";
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export type WorkflowNodeProps = {
  /** Override the announced name of a pressable node (defaults to `type: name` plus any status). */
  accessibilityLabel?: string;
  /** Override the type chip's fill (defaults to the type's category color). */
  color?: string;
  /**
   * Disable the shared focus glow on a pressable node. It then falls back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * The run-status flavour of {@link StatusDot}: the generic primitive plus this
 * module's status vocabulary, which supplies the color, the spoken label, and
 * the rule that only `running` pulses. Colors come from
 * {@link resolveStatusColor} rather than a {@link StatusDotTone} so the graph
 * keeps its own palette — notably the deliberately faint `skipped` dot.
 *
 * Unlike a bare `StatusDot`, this one names itself by default; pass `decorative`
 * to mute the announcement when the surrounding node already states the status.
 */
export function WorkflowStatusDot({
  decorative = false,
  size = "md",
  status,
  testID,
}: WorkflowStatusDotProps) {
  const theme = useSharedUiTheme();

  return (
    <StatusDot
      color={resolveStatusColor(theme.colors, status)}
      label={decorative ? undefined : STATUS_LABELS[status]}
      pulse={status === "running"}
      size={size}
      testID={testID}
    />
  );
}

/** The step card. See {@link WorkflowNodeProps}. */
export function WorkflowNode({
  accessibilityLabel,
  color,
  disableFocusRing = false,
  node,
  onPress,
  selected = false,
  size = "md",
  style,
  testID,
}: WorkflowNodeProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const focus = useFocusRing({ disabled: disableFocusRing });
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
        {/*
          Deliberately NOT `colors.onSolid`: node chips are a fixed category
          palette (workflowTypes.ts) that does not invert with the theme, and
          white passes ≥4.5:1 on all six fills. See plans/dark-mode.md.
        */}
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
          focus.focused && !selected && focus.ringEnabled
            ? styles.nodeFocused
            : null,
          style,
          focus.webOutlineReset,
        ]}
        testID={testID}
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
      testID={testID}
    >
      {body(false)}
    </View>
  );
}
