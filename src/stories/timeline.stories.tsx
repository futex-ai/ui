import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  applyTimelineEdits,
  type ControlSize,
  darkSharedUiTheme,
  formatTimecode,
  Timeline,
  type TimelineClipData,
  type TimelineEdit,
  type TimelineTool,
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

const TOOLS: { label: string; value: TimelineTool }[] = [
  { label: "Select", value: "select" },
  { label: "Razor", value: "razor" },
  { label: "Slip", value: "slip" },
  { label: "Roll", value: "roll" },
];

/**
 * The timeline is controlled, so a host holds the clips, the playhead, the
 * selection, and the track flags. Editing is one line: every gesture arrives as
 * a `TimelineEdit`, which `applyTimelineEdits` turns into the next clip list.
 */
function TimelineHost({
  editable = false,
  size = "md",
  zoomable = false,
}: {
  editable?: boolean;
  size?: ControlSize;
  zoomable?: boolean;
}) {
  const [clips, setClips] = useState<TimelineClipData[]>(sampleClips);
  const [playheadTime, setPlayheadTime] = useState(6.2);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([
    "shot-interview",
  ]);
  const [tracks, setTracks] = useState<TimelineTrack[]>(sampleTracks);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(48);
  const [tool, setTool] = useState<TimelineTool>("select");
  const [ripple, setRipple] = useState(false);
  // The story's own chrome reads the active theme, so the dark story does not
  // print near-black labels onto a dark panel (and pass the axe contrast sweep).
  const theme = useSharedUiTheme();

  const toggle = (trackId: string, flag: TimelineTrackFlag) =>
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, [flag]: !track[flag] } : track,
      ),
    );

  const applyEdit = (edit: TimelineEdit) =>
    setClips((current) => applyTimelineEdits(current, [edit], { tracks }));

  const selected = clips.find((clip) => clip.id === selectedClipIds[0]);

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
        {editable ? (
          <View style={styles.toolGroup}>
            {TOOLS.map((entry) => (
              <ToolButton
                active={tool === entry.value}
                key={entry.value}
                label={entry.label}
                onPress={() => setTool(entry.value)}
                testID={`timeline-tool-${entry.value}`}
              />
            ))}
            <ToolButton
              active={ripple}
              label="Ripple"
              onPress={() => setRipple((value) => !value)}
              testID="timeline-tool-ripple"
            />
          </View>
        ) : null}
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
        clips={clips}
        duration={sampleDuration}
        markers={sampleMarkers}
        onEdit={editable ? applyEdit : undefined}
        onSeek={setPlayheadTime}
        onSelectionChange={setSelectedClipIds}
        onTrackToggle={toggle}
        pixelsPerSecond={pixelsPerSecond}
        playheadTime={playheadTime}
        ripple={ripple}
        selectedClipIds={selectedClipIds}
        size={size}
        testID="timeline"
        tool={tool}
        tracks={tracks}
      />
    </View>
  );
}

function ToolButton({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const theme = useSharedUiTheme();
  return (
    <Pressable
      accessibilityLabel={active ? `${label} (active)` : label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.toolButton,
        {
          backgroundColor: active
            ? theme.colors.primarySoft
            : theme.colors.soft,
          borderColor: active ? theme.colors.primary : theme.colors.border2,
        },
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.toolButtonText,
          { color: active ? theme.colors.primaryDeep : theme.colors.ink2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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

/**
 * Drag a clip to move it, drag an edge to trim, sweep an empty lane to marquee
 * a selection, and switch tools to razor, slip, or roll. Ripple pushes whatever
 * is downstream out of the way.
 */
export const Editing: Story = {
  render: () => (
    <StorySurface>
      <TimelineHost editable zoomable />
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
      <TimelineHost editable />
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
  hint: { fontSize: 12 },
  host: { gap: 10, maxWidth: 940 },
  readout: { fontSize: 13, fontWeight: "700" },
  stack: { gap: 24 },
  toolButton: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolButtonText: { fontSize: 11, fontWeight: "700" },
  toolGroup: { flexDirection: "row", gap: 4 },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
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
