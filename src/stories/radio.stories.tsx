import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { RadioCard, RadioCardGroup } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Radio/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccountingBasisRadioCards: Story = {
  name: "Accounting basis radio cards",
  render: () => (
    <StorySurface>
      <AccountingBasisExample />
    </StorySurface>
  ),
};

function AccountingBasisExample() {
  const [basis, setBasis] = useState("cash");
  return (
    // `RadioCardGroup` owns the `radiogroup` role + arrow-key roving focus, so
    // the group is a single Tab stop and selection moves with Up/Down/Home/End
    // (WCAG 2.1 — 4.1.2, 2.1.1, A). `required` maps to `aria-required`.
    <RadioCardGroup
      accessibilityLabel="Accounting basis"
      required
      style={styles.group}
    >
      <RadioCard
        body="Record income and expenses when money moves."
        checked={basis === "cash"}
        onPress={() => setBasis("cash")}
        title="Cash basis"
      />
      <RadioCard
        body="Record income and expenses when invoices are issued."
        checked={basis === "accrual"}
        onPress={() => setBasis("accrual")}
        title="Accrual basis"
      />
      <RadioCard
        body="Available after VAT is enabled for the book."
        disabled
        title="Flat rate VAT"
      />
    </RadioCardGroup>
  );
}

const styles = StyleSheet.create({
  group: {
    minWidth: 320,
  },
});
