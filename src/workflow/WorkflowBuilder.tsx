/**
 * The workflow builder canvas — a vertical, branching step graph rendered from a
 * typed {@link WorkflowGraph}, used to construct automation workflows. It lays a
 * trigger-rooted spine of {@link WorkflowNode} cards on a dotted "graph paper"
 * canvas, routing transitions through tinted {@link WorkflowEdgeLabel} pills and
 * splitting at {@link WorkflowForkStep}s into parallel branches — a connector
 * rail carries the spine down into each branch. Nodes become pressable (to open
 * a step editor) when `onNodePress` is supplied. Given `onInsertStep`, each
 * transition instead shows a `+` button to insert a step in between.
 */
import { Plus } from "lucide-react-native";
import { Fragment, ReactNode, useMemo } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

import { Button } from "../button";
import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import {
  WorkflowConnector,
  WorkflowEdgeLabel,
  WorkflowInsertButton,
  WorkflowLegend,
  type WorkflowLegendItem,
} from "./WorkflowEdge";
import { WorkflowNode } from "./WorkflowNode";
import { dottedCanvasStyle } from "./workflowColors";
import { createWorkflowStyles, workflowSizing } from "./workflowStyles";
import {
  isWorkflowForkStep,
  type WorkflowBranch,
  type WorkflowEdge,
  type WorkflowGraph,
  type WorkflowInsertPosition,
  type WorkflowNodeData,
  type WorkflowNodeType,
  type WorkflowStep,
} from "./workflowTypes";

export type WorkflowBuilderProps = {
  /** Accessible label for the whole canvas. */
  accessibilityLabel?: string;
  /** Label for the trailing add-step button. Defaults to "Add step". */
  addStepLabel?: string;
  /**
   * Disable the shared focus glow on the nodes and insert buttons. They then fall
   * back to the browser's default focus outline so keyboard focus stays visible
   * (WCAG 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via the
   * theme's `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Render the dotted graph-paper canvas background (web). Defaults to `true`. */
  dotted?: boolean;
  /** The typed graph to render. */
  graph: WorkflowGraph;
  /**
   * Show the edge-tone legend under the spine: `true` for the default keys, or a
   * custom list of {@link WorkflowLegendItem}s. Defaults to hidden.
   */
  legend?: boolean | WorkflowLegendItem[];
  /** Override the category color chip per node type. */
  nodeColors?: Partial<Record<WorkflowNodeType, string>>;
  /** Show a trailing "Add step" button and handle its press. */
  onAddStep?: () => void;
  /**
   * Render each transition as a round `+` insert button (in place of the edge
   * labels) and handle inserting a step at that position.
   */
  onInsertStep?: (position: WorkflowInsertPosition) => void;
  /** Press handler per node; providing it makes every node a pressable button. */
  onNodePress?: (node: WorkflowNodeData) => void;
  /** The id of the actively-edited node, shown with the selected ring. */
  selectedNodeId?: string;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the canvas container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** The workflow builder canvas. See {@link WorkflowBuilderProps}. */
export function WorkflowBuilder({
  accessibilityLabel = "Workflow builder",
  addStepLabel = "Add step",
  disableFocusRing = false,
  dotted = true,
  graph,
  legend = false,
  nodeColors,
  onAddStep,
  onInsertStep,
  onNodePress,
  selectedNodeId,
  size = "md",
  style,
  testID,
}: WorkflowBuilderProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWorkflowStyles(theme, size),
    [theme, size],
  );
  const halfGap = workflowSizing(size).forkGap / 2;

  const renderNode = (node: WorkflowNodeData): ReactNode => (
    <WorkflowNode
      color={nodeColors?.[node.type]}
      disableFocusRing={disableFocusRing}
      node={node}
      onPress={onNodePress}
      selected={selectedNodeId === node.id}
      size={size}
    />
  );

  // The leading segment into a step: an insert (`+`) button in insert mode,
  // otherwise the edge-label cluster (connector · label · connector) when the
  // transition is labelled, or a plain connector when it is not.
  const lead = (
    position: WorkflowInsertPosition,
    edge?: WorkflowEdge,
  ): ReactNode => {
    if (onInsertStep) {
      return (
        <>
          <WorkflowConnector size={size} />
          <WorkflowInsertButton
            disableFocusRing={disableFocusRing}
            onPress={() => onInsertStep(position)}
            size={size}
          />
          <WorkflowConnector size={size} />
        </>
      );
    }
    return edge ? (
      <>
        <WorkflowConnector size={size} />
        <WorkflowEdgeLabel size={size} tone={edge.tone}>
          {edge.label}
        </WorkflowEdgeLabel>
        <WorkflowConnector size={size} />
      </>
    ) : (
      <WorkflowConnector size={size} />
    );
  };

  // The connector rail above a fork: a horizontal line spanning the branch
  // centers, with a vertical drop into each branch column so the spine visibly
  // splits. Rail cells share the branch row's flex + gap, so their centers line
  // up; the horizontal segment bridges the gap with a half-gap overhang.
  const renderForkRail = (count: number): ReactNode => (
    <View style={styles.forkRail}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.railCell}>
          {count > 1 ? (
            <View
              style={[styles.railLine, railLineOffsets(index, count, halfGap)]}
            />
          ) : null}
          <View style={styles.railDrop} />
        </View>
      ))}
    </View>
  );

  // Render one branch column: its condition label (if any), then its own spine.
  const renderBranch = (branch: WorkflowBranch): ReactNode => (
    <View key={branch.id} style={styles.branch}>
      {branch.condition ? (
        <>
          <WorkflowEdgeLabel
            size={size}
            tone={branch.condition.tone ?? "condition"}
          >
            {branch.condition.label}
          </WorkflowEdgeLabel>
          {lead({ branchId: branch.id, index: 0 })}
        </>
      ) : null}
      {renderSteps(branch.steps, true, branch.id)}
    </View>
  );

  // Render a sequence of steps. `suppressLeading` drops the leading segment above
  // the first step (the root of the spine or a branch head already fed by the
  // rail); every later step draws its incoming segment via `lead`.
  function renderSteps(
    steps: WorkflowStep[],
    suppressLeading: boolean,
    branchId?: string,
  ): ReactNode[] {
    return steps.map((step, index) => {
      const showLead = !(index === 0 && suppressLeading);
      // Node keys use the node id; fork keys include the step index so two forks
      // with the same branch-id structure still get unique sibling keys.
      const key = isWorkflowForkStep(step)
        ? `fork:${index}:${step.fork.map((b) => b.id).join("+")}`
        : step.node.id;
      return (
        <Fragment key={key}>
          {showLead ? lead({ branchId, index }, step.edge) : null}
          {isWorkflowForkStep(step) ? (
            <View style={styles.fork}>
              {renderForkRail(step.fork.length)}
              <View style={styles.forkBranches}>
                {step.fork.map(renderBranch)}
              </View>
            </View>
          ) : (
            renderNode(step.node)
          )}
        </Fragment>
      );
    });
  }

  const dottedStyle =
    Platform.OS === "web" && dotted ? dottedCanvasStyle(theme.colors) : null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.canvas, dottedStyle, style]}
      testID={testID}
    >
      <View style={styles.graph}>
        {renderSteps(graph.steps, true)}
        {onAddStep ? (
          <>
            <WorkflowConnector size={size} />
            <View style={styles.addStep}>
              <Button
                disableFocusRing={disableFocusRing}
                icon={Plus}
                onPress={onAddStep}
                size="sm"
              >
                {addStepLabel}
              </Button>
            </View>
          </>
        ) : onInsertStep ? (
          // Insert mode: a trailing `+` appends after the last step.
          <>
            <WorkflowConnector size={size} />
            <View style={styles.addStep}>
              <WorkflowInsertButton
                disableFocusRing={disableFocusRing}
                onPress={() => onInsertStep({ index: graph.steps.length })}
                size={size}
              />
            </View>
          </>
        ) : null}
        {legend !== false ? (
          <WorkflowLegend
            items={Array.isArray(legend) ? legend : undefined}
            size={size}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Horizontal offsets for a rail cell's line segment: the first cell runs from
 * its center to the right (bridging the gap), the last from the left to its
 * center, and middle cells span fully — so together they form one continuous
 * rail across the branch centers.
 */
function railLineOffsets(
  index: number,
  count: number,
  halfGap: number,
): ViewStyle {
  if (index === 0) return { left: "50%", right: -halfGap };
  if (index === count - 1) return { left: -halfGap, right: "50%" };
  return { left: -halfGap, right: -halfGap };
}
