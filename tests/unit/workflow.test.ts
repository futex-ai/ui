import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("workflow graph model discriminates fork steps from node steps", () => {
  const types = readSource("../../src/workflow/workflowTypes.ts");

  // A step is a fork or a node; the guard narrows on the `fork` key.
  assert.match(
    types,
    /export type WorkflowStep = WorkflowForkStep \| WorkflowNodeStep/,
  );
  assert.match(
    types,
    /export function isWorkflowForkStep\([\s\S]*?\): step is WorkflowForkStep \{\s*return "fork" in step;/,
  );
  // Branches carry their own condition and sub-steps for recursion.
  assert.match(
    types,
    /export type WorkflowBranch = \{[\s\S]*?condition\?: WorkflowEdge;[\s\S]*?steps: WorkflowStep\[\];/,
  );
});

test("workflow types ship default icon and category color maps", () => {
  const types = readSource("../../src/workflow/workflowTypes.ts");

  assert.match(
    types,
    /defaultWorkflowNodeIcons: Record<WorkflowNodeType, LucideIcon>/,
  );
  assert.match(types, /trigger: Zap/);
  assert.match(types, /branch: GitBranch/);
  assert.match(
    types,
    /defaultWorkflowNodeColors: Record<WorkflowNodeType, string>/,
  );
  // Six distinct decorative category colors.
  assert.match(types, /trigger: "#5b7be0"/);
  assert.match(types, /agent: "#7561c5"/);
});

test("builder renders a recursive spine with suppressed leading connectors", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");

  // The root spine and already-connected branch heads suppress the leading
  // connector; later steps always draw one.
  assert.match(
    source,
    /function renderSteps\(\s*steps: WorkflowStep\[\],\s*suppressLeading: boolean,\s*branchId\?: string,\s*\): ReactNode\[\]/,
  );
  assert.match(source, /const showLead = !\(index === 0 && suppressLeading\)/);
  assert.match(source, /renderSteps\(graph\.steps, true\)/);
  // Branch heads are already fed by the rail, so their spine suppresses the lead.
  assert.match(source, /renderSteps\(branch\.steps, true, branch\.id\)/);
  assert.match(source, /lead\(\{ branchId, index \}, step\.edge\)/);
});

test("builder's lead segment draws an edge cluster or a plain connector", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");

  // An edge draws conn + label + conn; a bare transition draws a single conn.
  assert.match(
    source,
    /return edge \? \([\s\S]*?<WorkflowConnector size=\{size\} \/>\s*<WorkflowEdgeLabel size=\{size\} tone=\{edge\.tone\}>[\s\S]*?<WorkflowConnector size=\{size\} \/>[\s\S]*?\) : \([\s\S]*?<WorkflowConnector size=\{size\} \/>/,
  );
});

test("builder renders a fork as a connector rail over the branch columns", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");
  const styles = readSource("../../src/workflow/workflowStyles.ts");

  // The fork stacks a rail (horizontal line + per-branch drop) over the branches.
  assert.match(
    source,
    /<View style=\{styles\.fork\}>\s*\{renderForkRail\(step\.fork\.length\)\}\s*<View style=\{styles\.forkBranches\}>\s*\{step\.fork\.map\(renderBranch\)\}/,
  );
  // Each rail cell carries a centered vertical drop and a positioned h-line.
  assert.match(source, /<View style=\{styles\.railDrop\} \/>/);
  assert.match(source, /railLineOffsets\(index, count, halfGap\)/);
  // First/last cells run half-in from a center, middle cells span fully.
  assert.match(
    source,
    /if \(index === 0\) return \{ left: "50%", right: -halfGap \}/,
  );
  assert.match(styles, /railDrop: \{[\s\S]*?left: "50%"/);
  // A branch renders its condition pill then its own spine.
  assert.match(
    source,
    /<WorkflowEdgeLabel[\s\S]*?tone=\{branch\.condition\.tone \?\? "condition"\}/,
  );
});

test("builder renders insert (+) buttons in place of edge labels in insert mode", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");

  // `lead` swaps the edge cluster for a `+` insert button when onInsertStep is set.
  assert.match(source, /if \(onInsertStep\) \{[\s\S]*?<WorkflowInsertButton/);
  assert.match(source, /onPress=\{\(\) => onInsertStep\(position\)\}/);
  // A trailing `+` appends after the last step in insert mode.
  assert.match(
    source,
    /onPress=\{\(\) => onInsertStep\(\{ index: graph\.steps\.length \}\)\}/,
  );
});

test("insert button is a focus-ringed + button primitive", () => {
  const edge = readSource("../../src/workflow/WorkflowEdge.tsx");

  assert.match(edge, /export function WorkflowInsertButton/);
  assert.match(edge, /accessibilityLabel = "Add step"/);
  assert.match(edge, /accessibilityRole="button"/);
  assert.match(edge, /useFocusRing/);
  assert.match(edge, /hideWebOutlineView/);
  assert.match(edge, /hovered \? styles\.insertButtonHover : null/);
});

test("builder shows an optional add-step button and legend", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");

  assert.match(source, /onAddStep \? \(/);
  assert.match(
    source,
    /<Button icon=\{Plus\} onPress=\{onAddStep\} size="sm">/,
  );
  assert.match(source, /\{addStepLabel\}/);
  assert.match(source, /legend !== false \? \(/);
  assert.match(
    source,
    /items=\{Array\.isArray\(legend\) \? legend : undefined\}/,
  );
});

test("builder paints the dotted graph-paper canvas on web only", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");
  const colors = readSource("../../src/workflow/workflowColors.ts");

  assert.match(
    source,
    /Platform\.OS === "web" && dotted \? dottedCanvasStyle\(theme\.colors\) : null/,
  );
  // The dotted background is a web-only cast (RN has no CSS background-image).
  assert.match(colors, /backgroundImage: `radial-gradient\(/);
  assert.match(colors, /as unknown as ViewStyle/);
});

test("node becomes a pressable button with selected and focus rings", () => {
  const source = readSource("../../src/workflow/WorkflowNode.tsx");

  assert.match(source, /if \(onPress\) \{/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ selected \}\}/);
  assert.match(source, /useFocusRing/);
  assert.match(source, /selected \? styles\.nodeSelected : null/);
  assert.match(
    source,
    /focus\.focused && !selected \? styles\.nodeFocused : null/,
  );
  assert.match(source, /hideWebOutlineView/);
  assert.match(source, /hovered \? styles\.nodeHover : null/);
  assert.match(source, /pressed \? styles\.nodePressed : null/);
});

test("node announces its type, name and status and dims skipped steps", () => {
  const source = readSource("../../src/workflow/WorkflowNode.tsx");

  assert.match(
    source,
    /\$\{typeLabel\}: \$\{node\.name\}\$\{[\s\S]*?STATUS_LABELS\[node\.status\]/,
  );
  assert.match(source, /node\.dim \? styles\.nodeDim : null/);
  // The icon is decorative on web (a label names the card).
  assert.match(
    source,
    /Platform\.OS === "web" \? \(\s*<Icon aria-hidden color="#fff"/,
  );
  // The category chip fill falls back to the type's default color.
  assert.match(
    source,
    /const chipColor = color \?\? defaultWorkflowNodeColors\[node\.type\]/,
  );
});

test("status dot carries a spoken status and pulses only when running", () => {
  const source = readSource("../../src/workflow/WorkflowNode.tsx");

  assert.match(
    source,
    /const STATUS_LABELS: Record<WorkflowNodeStatus, string>/,
  );
  assert.match(source, /const animate = status === "running" && !reduceMotion/);
  // The dot names itself with an image role, but mutes that when decorative
  // (inside a node whose own name already states the status).
  assert.match(
    source,
    /accessibilityLabel=\{decorative \? undefined : STATUS_LABELS\[status\]\}/,
  );
  assert.match(
    source,
    /accessibilityRole=\{decorative \? undefined : "image"\}/,
  );
  // The pulse loop stops on unmount / when animation is disabled.
  assert.match(source, /return \(\) => loop\.stop\(\)/);
});

test("node carries the composed label only when pressable (Table pattern)", () => {
  const source = readSource("../../src/workflow/WorkflowNode.tsx");

  // Pressable card: the button owns the composed name and mutes the nested dot.
  assert.match(source, /accessibilityLabel=\{label\}[\s\S]*?\{body\(true\)\}/);
  // Static card: no grouped name — its text and labelled dot announce naturally.
  assert.match(source, /\{body\(false\)\}/);
  assert.match(source, /<WorkflowStatusDot\s*decorative=\{dotDecorative\}/);
});

test("decorative graph rules are hidden from assistive tech on both platforms", () => {
  const edge = readSource("../../src/workflow/WorkflowEdge.tsx");

  // The connector mirrors the List separator: native `none` + web aria-hidden.
  assert.match(
    edge,
    /<View\s*accessibilityRole="none"\s*aria-hidden\s*role="none"/,
  );
  // The legend's `list` container owns `listitem` children.
  assert.match(edge, /<View key=\{item\.label\} role="listitem">/);
});

test("fork step keys include the step index for sibling uniqueness", () => {
  const source = readSource("../../src/workflow/WorkflowBuilder.tsx");

  assert.match(
    source,
    /`fork:\$\{index\}:\$\{step\.fork\.map\(\(b\) => b\.id\)\.join\("\+"\)\}`/,
  );
});

test("edge label tones resolve against the theme accent families", () => {
  const colors = readSource("../../src/workflow/workflowColors.ts");

  assert.match(
    colors,
    /case "success":[\s\S]*?backgroundColor: colors\.primarySoft,[\s\S]*?color: colors\.primaryDeep/,
  );
  assert.match(
    colors,
    /case "failure":[\s\S]*?backgroundColor: colors\.roseSoft,[\s\S]*?color: colors\.roseDeep/,
  );
  assert.match(
    colors,
    /case "condition":[\s\S]*?backgroundColor: colors\.amberSoft,[\s\S]*?color: colors\.amberDeep/,
  );
  // Status colors stay theme-driven (no invented green/blue tokens).
  assert.match(colors, /case "error":\s*return colors\.rose/);
  assert.match(colors, /case "waiting":\s*return colors\.amber/);
});

test("workflow styles are driven by shared theme tokens and the size scale", () => {
  const styles = readSource("../../src/workflow/workflowStyles.ts");

  assert.match(styles, /backgroundColor: theme\.colors\.surface/);
  assert.match(styles, /borderColor: theme\.colors\.controlBorder/);
  assert.match(styles, /backgroundColor: theme\.colors\.border2/); // connector
  assert.match(styles, /fontFamily: theme\.fonts\.mono/);
  // Distinct connector length per size.
  assert.match(styles, /sm: \{[\s\S]*?connector: 16/);
  assert.match(styles, /md: \{[\s\S]*?connector: 20/);
  assert.match(styles, /lg: \{[\s\S]*?connector: 24/);
});

test("workflow has public root and subpath exports plus a story", () => {
  const rootSource = readSource("../../src/index.ts");
  const indexSource = readSource("../../src/workflow/index.ts");
  const packageJson = readSource("../../package.json");
  const story = readSource("../../src/stories/workflow.stories.tsx");

  assert.match(rootSource, /export \* from "\.\/workflow"/);
  assert.match(indexSource, /export \* from "\.\/WorkflowBuilder"/);
  assert.match(packageJson, /"\.\/workflow"/);
  assert.match(story, /title: "Workflow\/Examples"/);
  assert.match(story, /<WorkflowBuilder/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
