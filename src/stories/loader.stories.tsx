import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Loader, LoaderVariant, ProgressBar, ProgressRing } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Loader/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const VARIANTS: { label: string; variant: LoaderVariant }[] = [
  { label: "ring", variant: "ring" },
  { label: "dot-grid", variant: "dot-grid" },
  { label: "dots", variant: "dots" },
  { label: "bars", variant: "bars" },
  { label: "blades", variant: "blades" },
  { label: "pulse", variant: "pulse" },
];

export const Variants: Story = {
  name: "Variants",
  render: () => (
    <StorySurface>
      <View style={styles.gallery}>
        {VARIANTS.map(({ label, variant }) => (
          <View key={variant} style={styles.cell}>
            <View style={styles.stage}>
              <Loader
                accessibilityLabel={`Loading ${label}`}
                variant={variant}
              />
            </View>
            <Text style={styles.caption}>{label}</Text>
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

export const DotGrid: Story = {
  name: "Dot grid",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Loader accessibilityLabel="Loading workspace" variant="dot-grid" />
        <Text style={styles.label}>Loading workspace…</Text>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.sizes}>
        <Loader
          accessibilityLabel="Small loader"
          size="sm"
          variant="dot-grid"
        />
        <Loader
          accessibilityLabel="Medium loader"
          size="md"
          variant="dot-grid"
        />
        <Loader
          accessibilityLabel="Large loader"
          size="lg"
          variant="dot-grid"
        />
        <Loader
          accessibilityLabel="Extra large loader"
          size={48}
          variant="dot-grid"
        />
      </View>
    </StorySurface>
  ),
};

export const OnColoredSurface: Story = {
  name: "On a colored surface",
  render: () => (
    <StorySurface>
      <View style={styles.button}>
        <Loader
          accessibilityLabel="Saving"
          color="#fff"
          size="sm"
          variant="dots"
        />
        <Text style={styles.buttonText}>Saving…</Text>
      </View>
    </StorySurface>
  ),
};

export const Progress: Story = {
  name: "Progress",
  render: () => (
    <StorySurface>
      <View style={styles.progressColumn}>
        <View style={styles.progressBlock}>
          <Text style={styles.caption}>Determinate — 42%</Text>
          <ProgressBar accessibilityLabel="Uploading" value={0.42} />
        </View>
        <View style={styles.progressBlock}>
          <Text style={styles.caption}>Indeterminate</Text>
          <ProgressBar accessibilityLabel="Syncing" />
        </View>
        <View style={styles.rings}>
          <ProgressRing
            accessibilityLabel="Storage used"
            size="lg"
            value={0.25}
          />
          <ProgressRing accessibilityLabel="Quota used" size="lg" value={0.6} />
          <ProgressRing
            accessibilityLabel="Import complete"
            size="lg"
            value={1}
          />
        </View>
      </View>
    </StorySurface>
  ),
};

/** Steps a value from 0 to 1 so the determinate shapes can be watched filling. */
function AdvancingProgress() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setValue((previous) =>
        previous >= 1 ? 0 : Number((previous + 0.1).toFixed(1)),
      );
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.progressColumn}>
      <Text style={styles.caption}>{Math.round(value * 100)}%</Text>
      <ProgressBar accessibilityLabel="Importing" value={value} />
      <View style={styles.rings}>
        <ProgressRing accessibilityLabel="Importing" size="lg" value={value} />
      </View>
    </View>
  );
}

export const ProgressAdvancing: Story = {
  name: "Progress advancing",
  render: () => (
    <StorySurface>
      <AdvancingProgress />
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2f5945",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    height: 40,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  caption: {
    color: "#69706a",
    fontSize: 12,
    fontWeight: "600",
  },
  cell: {
    alignItems: "center",
    gap: 10,
    width: 96,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    maxWidth: 360,
  },
  label: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  progressBlock: {
    gap: 8,
  },
  progressColumn: {
    gap: 20,
    width: 280,
  },
  rings: {
    flexDirection: "row",
    gap: 20,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minWidth: 240,
  },
  sizes: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
  },
  stage: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
  },
});
