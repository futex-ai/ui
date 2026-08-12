import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image, StyleSheet, Text, View } from "react-native";

import {
  darkSharedUiTheme,
  LevelMeter,
  PreviewSurface,
  Scrubber,
  type SharedUiTheme,
  Timeline,
  TransportBar,
  useSharedUiTheme,
} from "../index";

import { StorySurface } from "./sharedExamples";
import { useVideoEditorHost } from "./videoEditorHost";
import { sampleFrameAt, sampleScrubMarkers } from "./videoEditorSampleData";

const meta = {
  title: "Video editor/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** The player a real host would mount — here, the frame under the playhead. */
function SampleFrame({ uri }: { uri: string }) {
  return (
    <Image
      accessibilityLabel="Program output"
      // Without the role react-native-web renders a labelled generic element,
      // which is prohibited ARIA; `image` maps to `role="img"`, where the label
      // belongs.
      accessibilityRole="image"
      source={{ uri }}
      style={styles.frameImage}
    />
  );
}

function PanelHeading({ children }: { children: string }) {
  const theme = useSharedUiTheme();
  return (
    <Text style={[styles.heading, { color: theme.colors.ink2 }]}>
      {children}
    </Text>
  );
}

// --- individual panels -----------------------------------------------------

export const Preview: Story = {
  render: () => (
    <StorySurface>
      <View style={styles.previewRow}>
        <View style={styles.previewCell}>
          <PanelHeading>16:9 with composition guides</PanelHeading>
          <PreviewSurface
            accessibilityLabel="Program monitor"
            badge="1920×1080 · 30fps"
            showSafeAreas
            showThirds
            testID="preview-wide"
          >
            <SampleFrame uri={sampleFrameAt(4)} />
          </PreviewSurface>
        </View>
        <View style={styles.previewCellNarrow}>
          <PanelHeading>9:16</PanelHeading>
          <PreviewSurface
            accessibilityLabel="Vertical monitor"
            aspect="9:16"
            maxHeight={220}
            showCenter
          >
            <SampleFrame uri={sampleFrameAt(10)} />
          </PreviewSurface>
        </View>
        <View style={styles.previewCellNarrow}>
          <PanelHeading>Empty</PanelHeading>
          <PreviewSurface aspect="1:1" maxHeight={220} />
        </View>
      </View>
    </StorySurface>
  ),
};

export const Transport: Story = {
  render: () => (
    <StorySurface>
      <TransportHost />
    </StorySurface>
  ),
};

function TransportHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.transportStack}>
      <TransportBar
        buffered={host.duration * 0.7}
        currentTime={host.playheadTime}
        duration={host.duration}
        inPoint={host.inPoint}
        levels={host.levels}
        loop={host.loop}
        markers={sampleScrubMarkers}
        onMarkIn={() => host.setInPoint(host.playheadTime)}
        onMarkOut={() => host.setOutPoint(host.playheadTime)}
        onPlayPause={host.togglePlay}
        onRateChange={host.setRate}
        onSeek={host.setPlayheadTime}
        onStepFrame={host.stepFrame}
        onToggleLoop={host.toggleLoop}
        outPoint={host.outPoint}
        peakHolds={host.peakHolds}
        playing={host.playing}
        rate={host.rate}
        testID="transport"
      />
      <PanelHeading>Compact — play and seek only</PanelHeading>
      <TransportBar
        currentTime={host.playheadTime}
        duration={host.duration}
        onPlayPause={host.togglePlay}
        onSeek={host.setPlayheadTime}
        playing={host.playing}
        size="sm"
      />
    </View>
  );
}

export const Metering: Story = {
  render: () => (
    <StorySurface>
      <View style={styles.meterStack}>
        <PanelHeading>Quiet, working, and clipping</PanelHeading>
        <LevelMeter length={260} showScale values={[-34, -30]} />
        <LevelMeter
          length={260}
          peakHolds={[-8, -9]}
          showScale
          values={[-12, -14]}
        />
        <LevelMeter
          length={260}
          peakHolds={[-1, -1]}
          showScale
          values={[-2, -3]}
        />
        <PanelHeading>Standalone seek bar</PanelHeading>
        <ScrubberHost />
      </View>
    </StorySurface>
  ),
};

function ScrubberHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.scrubberCell}>
      <Scrubber
        buffered={host.duration * 0.6}
        currentTime={host.playheadTime}
        duration={host.duration}
        inPoint={4}
        markers={sampleScrubMarkers}
        onSeek={host.setPlayheadTime}
        outPoint={14}
        testID="standalone-scrubber"
      />
    </View>
  );
}

// --- the assembled editor --------------------------------------------------

/**
 * The headline demo: the panels hand-assembled into an editor, over one piece
 * of host state. Nothing here is a layout component from the library — the
 * shell is plain flexbox, which is the point: the family composes.
 */
function FullEditor() {
  const host = useVideoEditorHost();
  const theme = useSharedUiTheme();

  return (
    <View style={styles.editor}>
      <View style={styles.stage}>
        <View style={[styles.monitor, { borderColor: theme.colors.border }]}>
          <PreviewSurface
            accessibilityLabel="Program monitor"
            badge="1920×1080 · 30fps"
            maxHeight={280}
            showThirds
            testID="editor-preview"
          >
            <SampleFrame uri={host.frameUri} />
          </PreviewSurface>
          <TransportBar
            currentTime={host.playheadTime}
            duration={host.duration}
            inPoint={host.inPoint}
            levels={host.levels}
            loop={host.loop}
            markers={sampleScrubMarkers}
            onMarkIn={() => host.setInPoint(host.playheadTime)}
            onMarkOut={() => host.setOutPoint(host.playheadTime)}
            onPlayPause={host.togglePlay}
            onRateChange={host.setRate}
            onSeek={host.setPlayheadTime}
            onStepFrame={host.stepFrame}
            onToggleLoop={host.toggleLoop}
            outPoint={host.outPoint}
            peakHolds={host.peakHolds}
            playing={host.playing}
            rate={host.rate}
            testID="editor-transport"
          />
        </View>
      </View>
      <Timeline
        accessibilityLabel="Sequence"
        clips={host.clips}
        duration={host.duration}
        markers={host.markers}
        onEdit={host.applyEdit}
        onSeek={host.setPlayheadTime}
        onSelectionChange={host.setSelectedClipIds}
        onTrackToggle={host.toggleTrack}
        pixelsPerSecond={host.pixelsPerSecond}
        playheadTime={host.playheadTime}
        ripple={host.ripple}
        selectedClipIds={host.selectedClipIds}
        testID="editor-timeline"
        tool={host.tool}
        tracks={host.tracks}
      />
    </View>
  );
}

function FullEditorStory({ theme }: { theme?: SharedUiTheme }) {
  return (
    <StorySurface theme={theme}>
      <FullEditor />
    </StorySurface>
  );
}

export const FullEditorLight: Story = {
  name: "Full editor",
  render: () => <FullEditorStory />,
};

export const FullEditorDark: Story = {
  name: "Full editor (dark)",
  render: () => <FullEditorStory theme={darkSharedUiTheme} />,
};

const styles = StyleSheet.create({
  editor: { gap: 12, maxWidth: 1020 },
  frameImage: { height: "100%", width: "100%" },
  heading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  meterStack: { gap: 12, maxWidth: 420 },
  monitor: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  previewCell: { flexGrow: 1, gap: 6, minWidth: 320 },
  previewCellNarrow: { gap: 6, width: 160 },
  previewRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  scrubberCell: { width: 320 },
  stage: { alignItems: "stretch" },
  transportStack: { gap: 14, maxWidth: 760 },
});
