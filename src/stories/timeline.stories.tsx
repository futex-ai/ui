import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  type ControlSize,
  darkSharedUiTheme,
  formatTimecode,
  Timeline,
  type TimelineClipData,
  type TimelineTrack,
  type TimelineTrackFlag,
  useSharedUiTheme,
} from "../index";

import { StorySurface } from "./sharedExamples";
import {
  sampleClips,
  sampleDuration,
  sampleMarkers,
  sampleTracks,
} from "./timelineSampleData";

const meta = {
  title: "Timeline/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The timeline is controlled, so a host holds the playhead, the selection, and
 * the track flags. Everything here is the small amount of state a real editor
 * would also own.
 */
function TimelineHost({
  size = "md",
  zoomable = false,
}: {
  size?: ControlSize;
  zoomable?: boolean;
}) {
  const [playheadTime, setPlayheadTime] = useState(6.2);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([
    "shot-interview",
  ]);
  const [tracks, setTracks] = useState<TimelineTrack[]>(sampleTracks);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(48);
  // The story's own chrome reads the active theme, so the dark story does not
  // print near-black labels onto a dark panel (and pass the axe contrast sweep).
  const theme = useSharedUiTheme();

  const toggle = (trackId: string, flag: TimelineTrackFlag) =>
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, [flag]: !track[flag] } : track,
      ),
    );

  const selected: TimelineClipData | undefined = sampleClips.find(
    (clip) => clip.id === selectedClipIds[0],
  );

  return (
    <View style={styles.host}>
      <View style={styles.toolbar}>
        <Text
          style={[
            styles.readout,
            { color: theme.colors.ink, fontFamily: theme.fonts.mono },
          ]}
        >
          {formatTimecode(playheadTime, 30)}
        </Text>
        <Text style={[styles.hint, { color: theme.colors.ink2 }]}>
          {selected ? `Selected: ${selected.label}` : "Nothing selected"}
        </Text>
        {zoomable ? (
          <View style={styles.zoomGroup}>
            <ZoomButton
              label="Zoom out"
              onPress={() =>
                setPixelsPerSecond((value) => Math.max(8, value / 1.5))
              }
              symbol="−"
            />
            <ZoomButton
              label="Zoom in"
              onPress={() =>
                setPixelsPerSecond((value) => Math.min(600, value * 1.5))
              }
              symbol="+"
            />
          </View>
        ) : null}
      </View>
      <Timeline
        accessibilityLabel="Sequence"
        clips={sampleClips}
        duration={sampleDuration}
        markers={sampleMarkers}
        onSeek={setPlayheadTime}
        onSelectionChange={setSelectedClipIds}
        onTrackToggle={toggle}
        pixelsPerSecond={pixelsPerSecond}
        playheadTime={playheadTime}
        selectedClipIds={selectedClipIds}
        size={size}
        testID="timeline"
        tracks={tracks}
      />
    </View>
  );
}

function ZoomButton({
  label,
  onPress,
  symbol,
}: {
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  const theme = useSharedUiTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.zoomButton, { backgroundColor: theme.colors.soft }]}
    >
      <Text style={[styles.zoomButtonText, { color: theme.colors.ink }]}>
        {symbol}
      </Text>
    </Pressable>
  );
}

function DensityCaption({ children }: { children: string }) {
  const theme = useSharedUiTheme();
  return (
    <Text style={[styles.caption, { color: theme.colors.ink2 }]}>
      {children}
    </Text>
  );
}

export const Sequence: Story = {
  render: () => (
    <StorySurface>
      <TimelineHost />
    </StorySurface>
  ),
};

export const Zooming: Story = {
  render: () => (
    <StorySurface>
      <TimelineHost zoomable />
    </StorySurface>
  ),
};

export const Densities: Story = {
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <View key={size}>
            <DensityCaption>{size}</DensityCaption>
            <TimelineHost size={size} />
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <TimelineHost />
    </StorySurface>
  ),
};

export const Empty: Story = {
  render: () => (
    <StorySurface>
      <Timeline
        clips={[]}
        duration={0}
        playheadTime={0}
        testID="timeline-empty"
        tracks={[]}
      />
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  caption: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  host: { gap: 10, maxWidth: 940 },
  hint: { fontSize: 12 },
  readout: {
    fontSize: 13,
    fontWeight: "700",
  },
  stack: { gap: 24 },
  toolbar: { alignItems: "center", flexDirection: "row", gap: 12 },
  zoomButton: {
    alignItems: "center",
    borderRadius: 6,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  zoomButtonText: { fontSize: 14, fontWeight: "800" },
  zoomGroup: { flexDirection: "row", gap: 6 },
});
