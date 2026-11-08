import type { Meta, StoryObj } from "@storybook/react-native";
import { StyleSheet, View } from "react-native";

import {
  Text,
  TextScaleProvider,
  type TextScale,
  type TypographyVariant,
} from "@firna/ui/typography";

import { StoryScreen, StorySection } from "./storyParts";

const roles: readonly TypographyVariant[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "body",
  "label",
  "caption",
  "overline",
];

/** The nine text roles at one scale. */
function Roles({ scale }: { scale: TextScale }) {
  return (
    <TextScaleProvider scale={scale}>
      <View style={styles.roles}>
        {roles.map((role) => (
          <Text key={role} variant={role}>
            {`${role}: Billing portal`}
          </Text>
        ))}
      </View>
    </TextScaleProvider>
  );
}

/**
 * The default and the compact scale. A compact surface keeps one text at the
 * default scale through its own `scale`.
 */
function CompactScaleExample() {
  return (
    <StoryScreen>
      <StorySection title="Default scale">
        <Roles scale="default" />
      </StorySection>
      <StorySection title="Compact scale">
        <Roles scale="compact" />
      </StorySection>
      <StorySection title="One text keeps the default scale">
        <TextScaleProvider scale="compact">
          <Text>Compact body text on a dense surface.</Text>
          <Text scale="default">This text keeps the default scale.</Text>
        </TextScaleProvider>
      </StorySection>
    </StoryScreen>
  );
}

const meta: Meta = { title: "Typography/Native text scale" };

export default meta;

type Story = StoryObj;

export const CompactScale: Story = { render: () => <CompactScaleExample /> };

const styles = StyleSheet.create({ roles: { gap: 6 } });
