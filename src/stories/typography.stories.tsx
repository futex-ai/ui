import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, View } from "react-native";

import {
  Body,
  Caption,
  H1,
  H2,
  H3,
  H4,
  H5,
  Label,
  Overline,
  Text,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Typography/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const HeadingScale: Story = {
  name: "Heading scale",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <H1>Heading level 1</H1>
        <H2>Heading level 2</H2>
        <H3>Heading level 3</H3>
        <H4>Heading level 4</H4>
        <H5>Heading level 5</H5>
      </View>
    </StorySurface>
  ),
};

export const TextRoles: Story = {
  name: "Body, label, caption, overline",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Overline>Reconciliation</Overline>
        <H3>Invoice summary</H3>
        <Body>
          Body text is the default running-text role at a comfortable reading
          size and leading. It wraps across lines and sits beneath a heading.
        </Body>
        <Label>Reference</Label>
        <Caption>Last updated 19 June 2026 · Reconciled to 31 May</Caption>
      </View>
    </StorySurface>
  ),
};

export const SemanticColors: Story = {
  name: "Semantic color tokens",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Text color="default">Default ink — primary text.</Text>
        <Text color="secondary">Secondary — supporting copy.</Text>
        <Text color="muted">Muted — metadata and hints.</Text>
        <Text color="placeholder">Placeholder — faint but meaningful.</Text>
        <Text color="primary">Primary — branded emphasis.</Text>
        <Text color="danger">Danger — payment failed, retry the charge.</Text>
      </View>
    </StorySurface>
  ),
};

export const ColorOverride: Story = {
  name: "Raw color override",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <H4 color="#2f5945">Greenhouse Studio</H4>
        <Body color="#3e4540">A raw color string bypasses the token set.</Body>
      </View>
    </StorySurface>
  ),
};

export const Truncation: Story = {
  name: "Truncation",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Body numberOfLines={1}>
          This long line is clipped to a single line with a trailing ellipsis,
          while the full text stays the accessible name for screen readers.
        </Body>
        <Body numberOfLines={2}>
          This paragraph is clipped to two lines: anything past the second line
          is replaced with an ellipsis, so the surrounding layout stays compact
          even when the underlying copy runs long across several sentences.
        </Body>
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  stack: {
    gap: 10,
    maxWidth: 420,
  },
});
