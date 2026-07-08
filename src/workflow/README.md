# Workflow builder

Reusable React Native and React Native Web workflow builder: a vertical,
branching **step graph** for constructing automation workflows. It renders a
trigger-rooted spine of step cards on a dotted "graph paper" canvas, routing
transitions through tinted edge-label pills and splitting at branch points into
parallel branches — the manual graph canvas from the workflow-builder and
table-automation mockups.

## Responsibilities

- Render a typed `WorkflowGraph` as a top-to-bottom spine of `WorkflowNode`
  cards linked by connectors and `WorkflowEdgeLabel` transition pills.
- Support branching: a fork step splits the spine into parallel
  `WorkflowBranch` columns, each with its own condition label and sub-steps.
- Color-code the six node kinds (`trigger`, `code`, `agent`, `branch`, `app`,
  `outcome`) with an icon chip, and surface a per-node run `status` dot.
- Make nodes pressable buttons (to open a step editor) when `onNodePress` is
  given, with the shared hover / focus-ring / selected treatment.
- Offer an optional trailing **Add step** button and an edge-tone **legend**.
- Read all colors, fonts, and radii from `SharedUiThemeProvider`, and size on
  the shared `ControlSize` scale (`sm` / `md` / `lg`).

## Usage

```tsx
import { WorkflowBuilder, type WorkflowGraph } from "@firna/ui/workflow";

const graph: WorkflowGraph = {
  steps: [
    {
      node: { id: "trigger", type: "trigger", name: "When Status = Approved" },
    },
    {
      edge: { label: "on match", tone: "always" },
      node: { id: "post", type: "app", name: "slack.post_message · #social" },
    },
    {
      edge: { label: "success", tone: "success" },
      node: { id: "publish", type: "app", name: "Set Status = Published" },
    },
  ],
};

<WorkflowBuilder
  graph={graph}
  selectedNodeId={selectedId}
  onNodePress={(node) => openStepEditor(node.id)}
  onAddStep={addStep}
/>;
```

### The graph model

A `WorkflowGraph` is `{ steps }`. Each `WorkflowStep` is either:

- a **node step** — `{ edge?, node }`, where `edge` is the transition label into
  the node (omit it for the trigger / root); or
- a **fork step** — `{ edge?, fork }`, where `fork` is an array of
  `WorkflowBranch` columns. Each branch is `{ id, condition?, steps }` and
  renders its condition pill above its own sub-spine.

`WorkflowNode` data is `{ id, type, name, typeLabel?, status?, dim?, icon? }`.
The `type` picks the default icon and category color; override the icon per node
(`icon`) or the chip color per type via the builder's `nodeColors` prop.

### Branching

```tsx
const graph: WorkflowGraph = {
  steps: [
    {
      node: {
        id: "gate",
        type: "branch",
        name: "Quality gate",
        status: "error",
      },
    },
    {
      fork: [
        {
          id: "pass",
          condition: { label: "score ≥ 0.6", tone: "condition" },
          steps: [
            { node: { id: "review", type: "app", name: "Create outcomes" } },
          ],
        },
        {
          id: "fail",
          condition: { label: "score < 0.6", tone: "condition" },
          steps: [
            {
              node: {
                id: "skip",
                type: "code",
                name: "Record skipped",
                dim: true,
              },
            },
          ],
        },
      ],
    },
  ],
};
```

A fork renders a **connector rail** — a horizontal line spanning the branch
centers with a vertical drop into each branch — so the spine visibly splits into
each branch rather than just stacking columns.

### Insert mode — a `+` between steps

Pass `onInsertStep` to render a round `+` button on each transition (in place of
the edge labels) so a user can insert a step in between. It reports a
`WorkflowInsertPosition` — the `branchId` (or `undefined` for the main spine) and
the `index` in that spine's `steps` where the new step goes:

```tsx
<WorkflowBuilder
  graph={graph}
  onInsertStep={({ branchId, index }) => insertStepAt(branchId, index)}
/>
```

A trailing `+` after the last step appends (`index === steps.length`). The
`WorkflowInsertButton` primitive is exported for a hand-built canvas.

### Edge tones

`WorkflowEdgeLabel` tones map onto the theme's accent families (the same
philosophy as the `Badge`), so a theme swap recolors every transition:

| tone        | fill / text                   | use                    |
| ----------- | ----------------------------- | ---------------------- |
| `success`   | `primarySoft` / `primaryDeep` | the happy path         |
| `failure`   | `roseSoft` / `roseDeep`       | the error route        |
| `condition` | `amberSoft` / `amberDeep`     | a branch condition     |
| `always`    | `bg2` / `ink2`                | an unconditional route |
| `neutral`   | `bg2` / `ink2`                | default / untyped      |

Pass `legend` (`true` for the default keys, or a custom
`WorkflowLegendItem[]`) to show the legend under the spine.

> **Note — success is brand-tinted, not fixed green.** The mockups render
> `success` in a fixed green; this component instead maps it onto the theme's
> brand `primary` accent, matching the `Badge`'s deliberate choice not to invent
> a `good`/green token distinct from the brand. So `success` reads green in the
> default (accounting) theme and violet under `junoSharedUiTheme`. If a product
> needs a fixed green regardless of theme, add `good` tokens to the theme and
> extend `resolveEdgeColors`.

### Node status

`node.status` shows a colored dot with a spoken text alternative: `ok` /
`running` use the brand `primary` (the `running` dot gently pulses unless the
user prefers reduced motion), `waiting` the amber accent, `error` the rose
accent, and `skipped` a faint neutral.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default.
It scales the card padding, icon chip, connector length, and type scale so the
graph reads at the same density as the controls beside it.

### Composable primitives

`WorkflowBuilder` composes exported primitives you can hand-assemble for a
bespoke canvas: `WorkflowNode`, `WorkflowStatusDot`, `WorkflowConnector`,
`WorkflowEdgeLabel`, `WorkflowInsertButton`, and `WorkflowLegend`.

## Accessibility

- Node cards announce their `type: name` (plus any status); with `onNodePress`
  they are `button`-role pressables carrying the selected state, keyboard
  activation, the sage focus ring, and the hidden web outline.
- The run-status dot has a spoken label (e.g. "Running", "Error"), so status is
  never a color-only signal (WCAG 1.4.1 Use of Color / 1.1.1 Non-text Content).
- Transition tone is reinforced by the pill's visible text, not carried by color
  alone; the dotted canvas and connectors are decorative (`aria-hidden`).
- The `running` dot's pulse honours `prefers-reduced-motion` (2.3.3).

## Theming

Every color, font, and radius comes from `SharedUiThemeProvider`. The six node
category colors are a fixed decorative palette (like avatar colors) so the kinds
stay distinguishable across themes; override them per theme with `nodeColors`.
