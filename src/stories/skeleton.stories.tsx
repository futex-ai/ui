import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, Text, View } from "react-native";

import {
  SkeletonBar,
  SkeletonCircle,
  SkeletonGroup,
  darkSharedUiTheme,
  useSharedUiTheme,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Skeleton/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The demo's own chrome (the section labels and the card) reads from the theme
 * rather than fixed light values, so these examples compose under any preset —
 * including the dark ones. The default theme's tokens are the same values that
 * were hardcoded before, so the light stories are unchanged.
 */
function SectionLabel({ children }: { children: string }) {
  const theme = useSharedUiTheme();
  return (
    <Text style={[styles.label, { color: theme.colors.ink2 }]}>{children}</Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useSharedUiTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

function PrimitivesExample() {
  return (
    <View style={styles.stack}>
      <SectionLabel>Bars</SectionLabel>
      <View style={styles.bars}>
        <SkeletonBar width="40%" />
        <SkeletonBar width="80%" />
        <SkeletonBar width="60%" />
      </View>
      <SectionLabel>Circle</SectionLabel>
      <SkeletonCircle diameter={48} />
    </View>
  );
}

export const Primitives: Story = {
  name: "Primitives",
  render: () => (
    <StorySurface>
      <PrimitivesExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <PrimitivesExample />
    </StorySurface>
  ),
};

/**
 * A list-row shape composed from a {@link SkeletonGroup}: an avatar circle, a
 * flexing title / description column, and a trailing chip — all breathing in
 * unison off the group's shared pulse.
 */
export const ComposedRow: Story = {
  name: "Composed row",
  render: () => (
    <StorySurface>
      <Card>
        <SkeletonGroup gap={12}>
          <SkeletonCircle diameter={40} />
          <SkeletonGroup direction="column" gap={6} style={styles.fill}>
            <SkeletonBar height={14} width="50%" />
            <SkeletonBar height={11} width="80%" />
          </SkeletonGroup>
          <SkeletonBar height={12} radius="pill" width={56} />
        </SkeletonGroup>
      </Card>
    </StorySurface>
  ),
};

/** A card placeholder: a heading bar over a few flexing lines of body text. */
export const ComposedCard: Story = {
  name: "Composed card",
  render: () => (
    <StorySurface>
      <Card>
        <SkeletonGroup direction="column" gap={12}>
          <SkeletonBar height={18} radius="md" width="55%" />
          <SkeletonBar height={12} />
          <SkeletonBar height={12} />
          <SkeletonBar height={12} width="70%" />
        </SkeletonGroup>
      </Card>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  bars: {
    gap: 10,
    width: 280,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    width: 360,
  },
  fill: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  stack: {
    gap: 14,
  },
});
