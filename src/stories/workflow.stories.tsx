import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";

import {
  SharedUiThemeProvider,
  WorkflowBuilder,
  WorkflowEdgeLabel,
  WorkflowLegend,
  WorkflowNode,
  junoSharedUiTheme,
  type WorkflowEdgeTone,
  type WorkflowGraph,
  type WorkflowInsertPosition,
  type WorkflowNodeStatus,
  type WorkflowNodeType,
  type WorkflowStep,
} from "../index";

const meta = {
  title: "Workflow/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// A branching "daily tweet drafter" builder: a trigger-rooted spine that routes
// through a quality gate into two branches, mirroring the workflow-builder mockup.
const tweetGraph: WorkflowGraph = {
  steps: [
    {
      node: { id: "trigger", name: "Schedule · daily 09:00", type: "trigger" },
    },
    {
      edge: { label: "success", tone: "success" },
      node: { id: "collect", name: "Collect signals", type: "code" },
    },
    {
      edge: { label: "success", tone: "success" },
      node: { id: "draft", name: "Draft candidate tweets", type: "agent" },
    },
    {
      edge: { label: "success", tone: "success" },
      node: {
        id: "gate",
        name: "Quality gate · score ≥ 0.6",
        status: "error",
        type: "branch",
      },
    },
    {
      fork: [
        {
          condition: { label: "score ≥ 0.6", tone: "condition" },
          id: "pass",
          steps: [
            {
              node: {
                id: "review",
                name: "Create review outcomes",
                type: "app",
              },
            },
            {
              edge: { label: "failure", tone: "failure" },
              node: {
                id: "alert",
                name: "Post failure alert · #ops",
                type: "app",
              },
            },
          ],
        },
        {
          condition: { label: "score < 0.6", tone: "condition" },
          id: "fail",
          steps: [
            {
              node: {
                dim: true,
                id: "skip",
                name: "Record skipped signal",
                type: "code",
              },
            },
          ],
        },
      ],
    },
  ],
};

// A linear table automation: "publish approved" — an unconditional trigger into
// two app actions, with a trailing add-step affordance (the automation mockup).
const automationGraph: WorkflowGraph = {
  steps: [
    {
      node: { id: "trigger", name: "When Status = Approved", type: "trigger" },
    },
    {
      edge: { label: "on match", tone: "always" },
      node: { id: "post", name: "slack.post_message · #social", type: "app" },
    },
    {
      edge: { label: "success", tone: "success" },
      node: { id: "publish", name: "Set Status = Published", type: "app" },
    },
  ],
};

function Stage({
  children,
  width = 720,
}: {
  children: ReactNode;
  width?: number;
}) {
  return <View style={{ maxWidth: "100%", width }}>{children}</View>;
}

function BranchingBuilderExample() {
  const [selectedNodeId, setSelectedNodeId] = useState("draft");
  return (
    <Stage>
      <WorkflowBuilder
        graph={tweetGraph}
        legend
        onNodePress={(node) => setSelectedNodeId(node.id)}
        selectedNodeId={selectedNodeId}
      />
    </Stage>
  );
}

function AutomationEditorExample() {
  const [selectedNodeId, setSelectedNodeId] = useState("post");
  const [added, setAdded] = useState(0);
  return (
    <Stage width={520}>
      <WorkflowBuilder
        addStepLabel={added ? `Add step (${added})` : "Add step"}
        graph={automationGraph}
        onAddStep={() => setAdded((count) => count + 1)}
        onNodePress={(node) => setSelectedNodeId(node.id)}
        selectedNodeId={selectedNodeId}
      />
    </Stage>
  );
}

function InsertModeExample() {
  const [graph, setGraph] = useState<WorkflowGraph>(automationGraph);
  const [count, setCount] = useState(0);
  const insertAt = (position: WorkflowInsertPosition) => {
    const next = count + 1;
    setCount(next);
    const step: WorkflowStep = {
      node: { id: `added-${next}`, name: `New step ${next}`, type: "code" },
    };
    // The demo graph is a single spine, so every insert splices into it.
    setGraph((current) => {
      const steps = [...current.steps];
      steps.splice(position.index, 0, step);
      return { steps };
    });
  };
  return (
    <Stage width={520}>
      <WorkflowBuilder
        graph={graph}
        onInsertStep={insertAt}
        onNodePress={() => undefined}
      />
    </Stage>
  );
}

const nodeTypes: WorkflowNodeType[] = [
  "trigger",
  "code",
  "agent",
  "branch",
  "app",
  "outcome",
];

function NodeTypesExample() {
  const names: Record<WorkflowNodeType, string> = {
    agent: "Draft candidate tweets",
    app: "slack.post_message",
    branch: "Quality gate",
    code: "Collect signals",
    outcome: "Create review outcome",
    trigger: "Schedule · daily 09:00",
  };
  return (
    <View style={{ gap: 12 }}>
      {nodeTypes.map((type) => (
        <WorkflowNode key={type} node={{ id: type, name: names[type], type }} />
      ))}
    </View>
  );
}

const edgeTones: { label: string; tone: WorkflowEdgeTone }[] = [
  { label: "success", tone: "success" },
  { label: "failure", tone: "failure" },
  { label: "score ≥ 0.6", tone: "condition" },
  { label: "on match", tone: "always" },
];

function EdgeTonesExample() {
  return (
    <View style={{ alignItems: "flex-start", gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {edgeTones.map((edge) => (
          <WorkflowEdgeLabel key={edge.label} tone={edge.tone}>
            {edge.label}
          </WorkflowEdgeLabel>
        ))}
      </View>
      <WorkflowLegend />
    </View>
  );
}

const statuses: WorkflowNodeStatus[] = [
  "ok",
  "running",
  "waiting",
  "error",
  "skipped",
];

function StatusesExample() {
  const labels: Record<WorkflowNodeStatus, string> = {
    error: "Condition references unknown field",
    ok: "Posted to #social",
    running: "Classifying 12 tickets",
    skipped: "Below score threshold",
    waiting: "Awaiting review",
  };
  return (
    <View style={{ gap: 12 }}>
      {statuses.map((status) => (
        <WorkflowNode
          key={status}
          node={{ id: status, name: labels[status], status, type: "app" }}
        />
      ))}
    </View>
  );
}

function SizesExample() {
  const linear: WorkflowGraph = {
    steps: [
      { node: { id: "t", name: "When Status = Approved", type: "trigger" } },
      {
        edge: { label: "on match", tone: "always" },
        node: { id: "p", name: "slack.post_message", type: "app" },
      },
    ],
  };
  return (
    <View style={{ gap: 20 }}>
      <WorkflowBuilder dotted={false} graph={linear} size="sm" />
      <WorkflowBuilder dotted={false} graph={linear} size="md" />
      <WorkflowBuilder dotted={false} graph={linear} size="lg" />
    </View>
  );
}

export const BranchingBuilder: Story = {
  name: "Branching graph builder",
  parameters: { layout: "fullscreen" },
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 20 }}>
        <BranchingBuilderExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const AutomationEditor: Story = {
  name: "Linear automation + add step",
  parameters: { layout: "fullscreen" },
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 20 }}>
        <AutomationEditorExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const InsertMode: Story = {
  name: "Insert step (+ between steps)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 20 }}>
        <InsertModeExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const NodeTypes: Story = {
  name: "Node types",
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 24 }}>
        <NodeTypesExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const EdgeTones: Story = {
  name: "Edge tones & legend",
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 24 }}>
        <EdgeTonesExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const Statuses: Story = {
  name: "Node run statuses",
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 24 }}>
        <StatusesExample />
      </View>
    </SharedUiThemeProvider>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <SharedUiThemeProvider theme={junoSharedUiTheme}>
      <View style={{ padding: 24 }}>
        <SizesExample />
      </View>
    </SharedUiThemeProvider>
  ),
};
