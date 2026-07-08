/**
 * Shared types and defaults for the {@link WorkflowBuilder} step graph.
 *
 * A workflow is a vertical spine of {@link WorkflowStep}s. Each step is either a
 * {@link WorkflowNodeData} (an executable step — a trigger, code, agent, app
 * action, branch, or outcome) or a {@link WorkflowForkStep} that splits the
 * spine into parallel {@link WorkflowBranch}es. Transitions carry a typed
 * {@link WorkflowEdge} label (e.g. `success`, `failure`, a branch condition) so
 * the graph reads as a routed flow rather than a plain list.
 */
import type { LucideIcon } from "lucide-react-native";
import {
  Brain,
  GitBranch,
  Inbox,
  LayoutGrid,
  SquareTerminal,
  Zap,
} from "lucide-react-native";

/**
 * The kind of an executable step. Drives the node's default icon and its
 * category color chip:
 * - `trigger` — what starts the workflow (a schedule, a record change).
 * - `code` — a code / script step.
 * - `agent` — an LLM / agent step.
 * - `branch` — a conditional gate that forks the flow.
 * - `app` — an external app action (Slack, a table write).
 * - `outcome` — a record written back / a review item created.
 */
export type WorkflowNodeType =
  | "agent"
  | "app"
  | "branch"
  | "code"
  | "outcome"
  | "trigger";

/**
 * The run status of a node, shown as a colored dot with a text alternative:
 * - `ok` — completed successfully.
 * - `running` — in progress (the dot gently pulses unless reduced motion).
 * - `waiting` — queued / awaiting input.
 * - `error` — failed or has a validation error to fix.
 * - `skipped` — not taken on this run.
 */
export type WorkflowNodeStatus =
  | "error"
  | "ok"
  | "running"
  | "skipped"
  | "waiting";

/**
 * The semantic tone of a transition label:
 * - `success` — the happy path (brand / positive accent).
 * - `failure` — the error route (danger accent).
 * - `condition` — a branch condition (attention / warning accent).
 * - `always`/`neutral` — an unconditional transition (neutral).
 */
export type WorkflowEdgeTone =
  | "always"
  | "condition"
  | "failure"
  | "neutral"
  | "success";

/** A labelled transition into a step, or the condition atop a branch. */
export type WorkflowEdge = {
  /** The visible pill text, e.g. `success`, `on match`, `score ≥ 0.6`. */
  label: string;
  /** Semantic tone driving the pill's fill and text color. Defaults to `neutral`. */
  tone?: WorkflowEdgeTone;
};

/** A single executable step card. */
export type WorkflowNodeData = {
  /** Stable identifier, used as the React key and for selection / press. */
  id: string;
  /** The step kind; sets the default icon and category color. */
  type: WorkflowNodeType;
  /** The step's title, e.g. `Draft candidate tweets`. */
  name: string;
  /** The small uppercase category label. Defaults to the `type`. */
  typeLabel?: string;
  /** Optional run status, shown as a dot with a spoken status. */
  status?: WorkflowNodeStatus;
  /** Render the node de-emphasised (e.g. a skipped branch). */
  dim?: boolean;
  /** Override the default type icon with any `lucide-react-native` icon. */
  icon?: LucideIcon;
};

/** A node step: an optional incoming edge and the node it routes to. */
export type WorkflowNodeStep = {
  /** The transition label into this node. Omit for the first / root step. */
  edge?: WorkflowEdge;
  /** The step's node. */
  node: WorkflowNodeData;
};

/** A fork step: an optional incoming edge and the branches it splits into. */
export type WorkflowForkStep = {
  /** The transition label into the fork point. */
  edge?: WorkflowEdge;
  /** The parallel branches; each carries its own condition and sub-steps. */
  fork: WorkflowBranch[];
};

/** One step on a spine — either a node or a fork. */
export type WorkflowStep = WorkflowForkStep | WorkflowNodeStep;

/** One column of a {@link WorkflowForkStep}: a condition plus its own spine. */
export type WorkflowBranch = {
  /** Stable identifier, used as the React key. */
  id: string;
  /** The condition label shown atop the branch, e.g. `score ≥ 0.6`. */
  condition?: WorkflowEdge;
  /** The branch's own sequence of steps. */
  steps: WorkflowStep[];
};

/** The whole graph: an ordered spine of steps starting at the trigger. */
export type WorkflowGraph = {
  /** The steps along the main spine, top to bottom. */
  steps: WorkflowStep[];
};

/**
 * Where a new step is inserted, passed to the builder's `onInsertStep` handler
 * when the graph is rendered in insert mode (a `+` button on each transition).
 */
export type WorkflowInsertPosition = {
  /** The branch the insert point sits in, or `undefined` for the main spine. */
  branchId?: string;
  /** The zero-based index in that spine's `steps` where the new step goes. */
  index: number;
};

/** Narrow a {@link WorkflowStep} to a fork step. */
export function isWorkflowForkStep(
  step: WorkflowStep,
): step is WorkflowForkStep {
  return "fork" in step;
}

/**
 * Default icon per node type. Consumers can override per node (`node.icon`) or
 * wholesale via the builder's `nodeIcons` prop.
 */
export const defaultWorkflowNodeIcons: Record<WorkflowNodeType, LucideIcon> = {
  agent: Brain,
  app: LayoutGrid,
  branch: GitBranch,
  code: SquareTerminal,
  outcome: Inbox,
  trigger: Zap,
};

/**
 * Default category color per node type — the white-glyph icon chip fill. These
 * are a decorative, category-coding palette (like avatar colors), deliberately
 * fixed rather than theme tokens so the six kinds stay distinguishable across
 * themes; override per theme via the builder's `nodeColors` prop.
 */
export const defaultWorkflowNodeColors: Record<WorkflowNodeType, string> = {
  agent: "#7561c5",
  app: "#c95d92",
  branch: "#c28c3a",
  code: "#27867a",
  outcome: "#4fa672",
  trigger: "#5b7be0",
};
