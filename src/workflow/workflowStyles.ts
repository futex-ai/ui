import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the builder: the node card padding and icon-chip size,
 * the connector length, and the type / title / edge-label type scale. `md` is
 * the default density (matching the mockup's 282px cards); `sm` is the compact
 * density for embedded editors and `lg` the roomier, touch-first density, in
 * lockstep with the other controls' {@link ControlSize} scale.
 */
const WORKFLOW_SIZES: Record<
  ControlSize,
  {
    chip: number;
    chipIcon: number;
    connector: number;
    edgeFontSize: number;
    forkGap: number;
    insertIcon: number;
    insertSize: number;
    namePadding: number;
    nameFontSize: number;
    typeFontSize: number;
    nodeWidth: number;
  }
> = {
  sm: {
    chip: 28,
    chipIcon: 14,
    connector: 16,
    edgeFontSize: 9.5,
    forkGap: 16,
    insertIcon: 13,
    insertSize: 20,
    namePadding: 9,
    nameFontSize: 12,
    typeFontSize: 9,
    nodeWidth: 240,
  },
  md: {
    chip: 32,
    chipIcon: 16,
    connector: 20,
    edgeFontSize: 10,
    forkGap: 20,
    insertIcon: 14,
    insertSize: 22,
    namePadding: 11,
    nameFontSize: 13,
    typeFontSize: 9.5,
    nodeWidth: 280,
  },
  lg: {
    chip: 36,
    chipIcon: 18,
    connector: 24,
    edgeFontSize: 11,
    forkGap: 24,
    insertIcon: 16,
    insertSize: 26,
    namePadding: 13,
    nameFontSize: 14,
    typeFontSize: 10,
    nodeWidth: 320,
  },
};

/** Geometry read by {@link WorkflowNode} that lives outside the stylesheet. */
export function workflowSizing(size: ControlSize = "md") {
  return WORKFLOW_SIZES[size];
}

/**
 * Build the builder's themed styles for a given size. The node card mirrors the
 * shared button / list-row treatment (surface fill, `controlBorder` edge, soft
 * shadow) with the pressable states — hover, pressed, focus ring, disabled —
 * layered on when the node is given a press handler, plus a selected ring for
 * the actively-edited node.
 */
export function createWorkflowStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const sizing = WORKFLOW_SIZES[size];
  const mono = { fontFamily: theme.fonts.mono } as const;
  return StyleSheet.create({
    // Canvas + spine layout.
    canvas: {
      backgroundColor: theme.colors.bg,
      padding: 24,
      width: "100%",
    },
    graph: {
      alignItems: "center",
      alignSelf: "center",
      width: "100%",
    },
    // Vertical connector segment.
    connector: {
      backgroundColor: theme.colors.border2,
      height: sizing.connector,
      width: 2,
    },
    // Edge / condition label pill.
    edge: {
      alignItems: "center",
      alignSelf: "center",
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    edgeText: {
      ...mono,
      fontSize: sizing.edgeFontSize,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    // Fork + branch layout. The fork is a column: a connector rail (a horizontal
    // line with a vertical drop into each branch) over the row of branch columns,
    // so the spine visibly splits into each branch.
    fork: {
      alignItems: "center",
      width: "100%",
    },
    forkRail: {
      flexDirection: "row",
      gap: sizing.forkGap,
      width: "100%",
    },
    forkBranches: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: sizing.forkGap,
      justifyContent: "center",
      width: "100%",
    },
    branch: {
      alignItems: "center",
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    // One rail cell above a branch column: the horizontal rail segment (top) and
    // the vertical drop (center) that carries the line down into the branch. The
    // per-cell horizontal offsets are applied inline (they depend on position).
    railCell: {
      flexGrow: 1,
      flexShrink: 1,
      height: sizing.connector,
      minWidth: 0,
      position: "relative",
    },
    railDrop: {
      backgroundColor: theme.colors.border2,
      bottom: 0,
      left: "50%",
      marginLeft: -1,
      position: "absolute",
      top: 0,
      width: 2,
    },
    railLine: {
      backgroundColor: theme.colors.border2,
      height: 2,
      position: "absolute",
      top: 0,
    },
    // Round `+` insert button that sits on a connector (insert mode).
    insertButton: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      cursor: "pointer",
      height: sizing.insertSize,
      justifyContent: "center",
      width: sizing.insertSize,
    },
    insertButtonHover: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    insertButtonFocused: {
      boxShadow: `0 0 0 2px ${theme.colors.primary}`,
    },
    // Node card.
    node: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.xl,
      borderWidth: 1,
      boxShadow: "0 1px 2px rgba(20, 18, 38, 0.05)",
      flexDirection: "row",
      gap: 11,
      maxWidth: "100%",
      paddingHorizontal: sizing.namePadding + 2,
      paddingVertical: sizing.namePadding,
      width: sizing.nodeWidth,
    },
    nodeDim: { opacity: 0.5 },
    nodePressable: { cursor: "pointer" },
    nodeHover: { backgroundColor: theme.colors.soft },
    nodePressed: { backgroundColor: theme.colors.bg2 },
    // Selected + focus rings sit on the box-shadow channel so they layer over the
    // resting border without shifting layout.
    nodeSelected: {
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${theme.colors.primarySoft}`,
    },
    nodeFocused: { boxShadow: `inset 0 0 0 2px ${theme.colors.primary}` },
    nodeDisabled: { opacity: 0.55 },
    chip: {
      alignItems: "center",
      borderRadius: Math.round(sizing.chip * 0.28),
      height: sizing.chip,
      justifyContent: "center",
      width: sizing.chip,
    },
    body: { flexGrow: 1, flexShrink: 1, gap: 1, minWidth: 0 },
    typeText: {
      ...mono,
      color: theme.colors.muted,
      fontSize: sizing.typeFontSize,
      fontWeight: "700",
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
    nameText: {
      color: theme.colors.ink,
      fontFamily: theme.fonts.sans,
      fontSize: sizing.nameFontSize,
      fontWeight: "600",
    },
    // The run-status dot's geometry lives in `status-dot/statusDotStyles.ts`;
    // `WorkflowStatusDot` renders the shared primitive so the graph and the rest
    // of the library cannot drift into two dot sizes.
    // Legend row.
    legend: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      paddingTop: 12,
    },
    // Add-step affordance wrapper (keeps the button centered under the spine).
    addStep: { alignItems: "center", alignSelf: "center" },
  });
}

export type WorkflowStyles = ReturnType<typeof createWorkflowStyles>;
