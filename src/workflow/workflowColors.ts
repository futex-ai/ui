/**
 * Theme-driven color mapping for the workflow builder: the edge-label tone
 * fills, the node status-dot color, and the web-only dotted canvas background.
 * Kept out of {@link createWorkflowStyles} because these read raw
 * {@link SharedUiColors} (not a per-size stylesheet) and are shared by several
 * of the graph primitives.
 */
import type { ViewStyle } from "react-native";

import type { SharedUiColors } from "../theme";

import type { WorkflowEdgeTone, WorkflowNodeStatus } from "./workflowTypes";

/** Resolved fill / text / border for an edge label of a given tone. */
export type EdgeColors = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

/**
 * Map a {@link WorkflowEdgeTone} onto the theme's accent families — the same
 * philosophy as the {@link Badge}: `success` follows the brand `primary` accent
 * (green in the default theme), `failure` the rose danger accent, `condition`
 * the amber warning accent, and `always`/`neutral` a quiet neutral. Every pair
 * keeps its deep text ≥4.5:1 on its own soft fill in all four shipped themes.
 */
export function resolveEdgeColors(
  colors: SharedUiColors,
  tone: WorkflowEdgeTone = "neutral",
): EdgeColors {
  switch (tone) {
    case "success":
      return {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primaryBorder,
        color: colors.primaryDeep,
      };
    case "failure":
      return {
        backgroundColor: colors.roseSoft,
        borderColor: colors.roseSoft,
        color: colors.roseDeep,
      };
    case "condition":
      return {
        backgroundColor: colors.amberSoft,
        borderColor: colors.amberSoft,
        color: colors.amberDeep,
      };
    default:
      return {
        backgroundColor: colors.bg2,
        borderColor: colors.border2,
        color: colors.ink2,
      };
  }
}

/**
 * Map a {@link WorkflowNodeStatus} onto a theme accent for its dot. Kept
 * theme-driven (no invented green/blue tokens): `ok`/`running` use the brand
 * `primary`, `waiting` the amber accent, `error` the rose accent, and `skipped`
 * a faint neutral.
 */
export function resolveStatusColor(
  colors: SharedUiColors,
  status: WorkflowNodeStatus,
): string {
  switch (status) {
    case "ok":
    case "running":
      return colors.primary;
    case "waiting":
      return colors.amber;
    case "error":
      return colors.rose;
    default:
      return colors.faint;
  }
}

/**
 * The dotted "graph paper" canvas background. React Native has no CSS
 * background-image, so the radial-dot grid is a web-only enhancement applied via
 * a cast; native falls back to the solid `bg` fill on the base `canvas` style.
 */
export function dottedCanvasStyle(colors: SharedUiColors): ViewStyle {
  return {
    backgroundColor: colors.bg,
    backgroundImage: `radial-gradient(${colors.border2} 1px, transparent 1px)`,
    backgroundSize: "22px 22px",
  } as unknown as ViewStyle;
}
