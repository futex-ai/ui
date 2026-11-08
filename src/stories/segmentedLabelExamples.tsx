/** Icon, label info, and accessible name examples for the Segmented stories. */
import {
  Columns2,
  LayoutGrid,
  ShieldQuestionMark,
  Table,
  User,
} from "../primitives/icons";
import { useState } from "react";
import { View } from "../primitives/reactNative";

import { SegmentedControl } from "../index";

const basisOptions = [
  { label: "Accrual", value: "accrual" },
  { label: "Cash", value: "cash" },
];

const scopeOptions = [
  { label: "All accounts", value: "all" },
  { label: "Active", value: "active" },
];

const dateModeOptions = [
  { label: "Auto", value: "auto" },
  { accessibilityLabel: "Custom start date", label: "Custom", value: "start" },
  { accessibilityLabel: "Custom end date", label: "Custom", value: "end" },
];

export function WithIconsExample() {
  const [board, setBoard] = useState("board");
  const [scope, setScope] = useState("me");
  const [scopeCompact, setScopeCompact] = useState("me");
  return (
    <View style={{ gap: 18, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Tasks layout"
        label="Icon + label — Board / Table toggle"
        onChange={setBoard}
        options={[
          { icon: Columns2, label: "Board", value: "board" },
          { icon: Table, label: "Table", value: "table" },
        ]}
        value={board}
      />
      <SegmentedControl
        accessibilityLabel="Scope"
        label="Icon + label — Personal / Workspace scope"
        onChange={setScope}
        options={[
          { icon: User, label: "Personal", value: "me" },
          { icon: LayoutGrid, label: "Workspace", value: "workspace" },
        ]}
        value={scope}
      />
      <SegmentedControl
        accessibilityLabel="Scope (compact)"
        iconOnly
        label="iconOnly — labels are the accessible name only"
        onChange={setScopeCompact}
        options={[
          { icon: User, label: "Personal", value: "me" },
          { icon: LayoutGrid, label: "Workspace", value: "workspace" },
        ]}
        value={scopeCompact}
      />
    </View>
  );
}

export function LabelInfoExample() {
  const [basis, setBasis] = useState("accrual");
  const [scope, setScope] = useState("all");
  return (
    <View style={{ gap: 18, minWidth: 320 }}>
      <SegmentedControl
        // The ⓘ after the label opens a tooltip with the detail, so the
        // always-read `hint` stays free for short, everyday guidance.
        hint="Most businesses report on an accruals basis."
        label="Accounting basis"
        labelInfo="Accrual accounting records income and expenses when they are earned or incurred; cash accounting records them only when money actually moves."
        onChange={setBasis}
        options={basisOptions}
        value={basis}
      />
      <SegmentedControl
        // `labelInfoIcon` swaps the default ⓘ glyph and `labelInfoLabel` names
        // the button when the default reads awkwardly.
        label="Report scope"
        labelInfo="“All accounts” includes archived ledgers; “Active” limits the report to accounts with movement in the period."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="What each scope covers"
        onChange={setScope}
        options={scopeOptions}
        value={scope}
      />
    </View>
  );
}

export function DuplicateLabelsExample() {
  const [mode, setMode] = useState("auto");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Date mode"
        onChange={setMode}
        options={dateModeOptions}
        value={mode}
      />
    </View>
  );
}
