import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { RadioCard } from "../index";
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

export const DistinguishableRadioCards: Story = {
  name: "Distinguishable radio cards",
  render: () => (
    <StorySurface>
      <CollidingTitlesExample />
    </StorySurface>
  ),
};

function CollidingTitlesExample() {
  const [choice, setChoice] = useState("recommended");
  return (
    <View
      accessibilityLabel="VAT scheme"
      accessibilityRole="radiogroup"
      style={styles.group}
    >
      <RadioCard
        accessibilityLabel="Cash basis (recommended)"
        body="Recommended for most small businesses."
        checked={choice === "recommended"}
        onPress={() => setChoice("recommended")}
        title="Cash basis"
      />
      <RadioCard
        body="Record income when invoices are issued."
        checked={choice === "standard"}
        onPress={() => setChoice("standard")}
        title="Cash basis"
      />
    </View>
  );
}

function AccountingBasisExample() {
  const [basis, setBasis] = useState("cash");
  return (
    <View
      accessibilityLabel="Accounting basis"
      accessibilityRole="radiogroup"
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
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
    minWidth: 320,
  },
});
