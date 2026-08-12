import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image, StyleSheet, Text, View } from "react-native";

import {
  darkSharedUiTheme,
  EffectsRack,
  Inspector,
  KeyframeEditor,
  LevelMeter,
  MediaBin,
  PreviewSurface,
  Scrubber,
  type SharedUiTheme,
  Timeline,
  TransportBar,
  useSharedUiTheme,
} from "../index";

import { StorySurface } from "./sharedExamples";
import { useVideoEditorHost } from "./videoEditorHost";
import { sampleEffectOptions } from "./videoEditorEffects";
import {
  sampleAssets,
  sampleFrameAt,
  sampleScrubMarkers,
} from "./videoEditorSampleData";

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

export const Media: Story = {
  render: () => (
    <StorySurface>
      <MediaBinHost />
    </StorySurface>
  ),
};

function MediaBinHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.binRow}>
      <MediaBin
        accessibilityLabel="Media bin"
        assets={sampleAssets}
        maxHeight={280}
        onQueryChange={host.setAssetQuery}
        onSelectionChange={host.setSelectedAssetIds}
        onViewChange={host.setBinView}
        query={host.assetQuery}
        selectedAssetIds={host.selectedAssetIds}
        style={styles.binPanel}
        testID="media-bin"
        title="Media"
        view={host.binView}
      />
      <MediaBin
        accessibilityLabel="Media bin, list view"
        assets={sampleAssets}
        maxHeight={280}
        style={styles.binPanel}
        title="List view"
        view="list"
      />
    </View>
  );
}

export const Properties: Story = {
  render: () => (
    <StorySurface>
      <InspectorHost />
    </StorySurface>
  ),
};

function InspectorHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.inspectorRow}>
      <Inspector
        accessibilityLabel="Clip properties"
        keyframedIds={host.keyframedIds}
        maxHeight={320}
        onChange={host.setProperty}
        onReset={host.resetProperty}
        onToggleKeyframe={host.toggleKeyframe}
        onToggleSection={host.toggleSection}
        sections={host.inspectorSections}
        style={styles.inspectorPanel}
        testID="inspector"
        title={host.selectedClip?.label}
      />
      <Inspector
        accessibilityLabel="Empty properties"
        sections={[]}
        style={styles.inspectorPanel}
        title="Nothing selected"
      />
    </View>
  );
}

export const Effects: Story = {
  render: () => (
    <StorySurface>
      <EffectsHost />
    </StorySurface>
  ),
};

function EffectsHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.effectsRow}>
      <EffectsRack
        accessibilityLabel="Effects"
        addOptions={sampleEffectOptions}
        effects={host.effects}
        onAdd={() => undefined}
        onPropertyChange={host.setEffectProperty}
        onRemove={host.removeEffect}
        onReorder={host.reorderEffects}
        onToggleCollapsed={host.toggleEffectCollapsed}
        onToggleEnabled={host.toggleEffect}
        style={styles.effectsPanel}
        testID="effects-rack"
        title="Effects"
      />
      <EffectsRack
        accessibilityLabel="Empty effects"
        effects={[]}
        style={styles.effectsPanel}
        title="Empty"
      />
    </View>
  );
}

export const Keyframes: Story = {
  render: () => (
    <StorySurface>
      <KeyframeHost />
    </StorySurface>
  ),
};

function KeyframeHost() {
  const host = useVideoEditorHost();
  return (
    <View style={styles.keyframeStack}>
      <PanelHeading>Lanes</PanelHeading>
      <KeyframeEditor
        accessibilityLabel="Keyframe lanes"
        endTime={host.duration}
        onKeyframeMove={host.updateKeyframe}
        onKeyframeRemove={host.deleteKeyframe}
        onSelectionChange={host.setSelectedKeyframeIds}
        pixelsPerSecond={host.pixelsPerSecond}
        playheadTime={host.playheadTime}
        selectedKeyframeIds={host.selectedKeyframeIds}
        testID="keyframe-lanes"
        tracks={host.keyframeTracks}
      />
      <PanelHeading>Curves</PanelHeading>
      <KeyframeEditor
        accessibilityLabel="Keyframe curves"
        endTime={host.duration}
        mode="curve"
        onKeyframeMove={host.updateKeyframe}
        onSelectionChange={host.setSelectedKeyframeIds}
        pixelsPerSecond={host.pixelsPerSecond}
        playheadTime={host.playheadTime}
        selectedKeyframeIds={host.selectedKeyframeIds}
        testID="keyframe-curves"
        tracks={host.keyframeTracks}
      />
      <PanelHeading>Nothing animated</PanelHeading>
      <KeyframeEditor endTime={10} pixelsPerSecond={40} tracks={[]} />
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
        <MediaBin
          accessibilityLabel="Media bin"
          assets={sampleAssets}
          maxHeight={300}
          onAssetActivate={() => undefined}
          onQueryChange={host.setAssetQuery}
          onSelectionChange={host.setSelectedAssetIds}
          onViewChange={host.setBinView}
          query={host.assetQuery}
          selectedAssetIds={host.selectedAssetIds}
          style={styles.bin}
          testID="editor-bin"
          title="Media"
          view={host.binView}
        />
        <View
          style={[
            styles.monitor,
            { borderColor: theme.colors.border },
            styles.monitorGrow,
          ]}
        >
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
        <Inspector
          accessibilityLabel="Clip properties"
          keyframedIds={host.keyframedIds}
          maxHeight={300}
          onChange={host.setProperty}
          onReset={host.resetProperty}
          onToggleKeyframe={host.toggleKeyframe}
          onToggleSection={host.toggleSection}
          sections={host.inspectorSections}
          style={styles.inspector}
          testID="editor-inspector"
          title={host.selectedClip?.label ?? "Nothing selected"}
        />
      </View>
      <View style={styles.lower}>
        <EffectsRack
          accessibilityLabel="Effects"
          addOptions={sampleEffectOptions}
          effects={host.effects}
          onAdd={() => undefined}
          onPropertyChange={host.setEffectProperty}
          onRemove={host.removeEffect}
          onReorder={host.reorderEffects}
          onToggleCollapsed={host.toggleEffectCollapsed}
          onToggleEnabled={host.toggleEffect}
          size="sm"
          style={styles.rack}
          testID="editor-effects"
          title="Effects"
        />
        <KeyframeEditor
          accessibilityLabel="Keyframes"
          endTime={host.duration}
          onKeyframeMove={host.updateKeyframe}
          onKeyframeRemove={host.deleteKeyframe}
          onSelectionChange={host.setSelectedKeyframeIds}
          pixelsPerSecond={host.pixelsPerSecond}
          playheadTime={host.playheadTime}
          selectedKeyframeIds={host.selectedKeyframeIds}
          size="sm"
          style={styles.keyframes}
          testID="editor-keyframes"
          tracks={host.keyframeTracks}
        />
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
  bin: { width: 210 },
  binPanel: { flexGrow: 1, minWidth: 240 },
  binRow: { flexDirection: "row", gap: 16, maxWidth: 760 },
  editor: { gap: 12, maxWidth: 1120 },
  effectsPanel: { flexGrow: 1, minWidth: 260 },
  effectsRow: { flexDirection: "row", gap: 16, maxWidth: 680 },
  keyframeStack: { gap: 8, maxWidth: 940 },
  keyframes: { flex: 1, overflow: "hidden" },
  lower: { flexDirection: "row", gap: 12 },
  rack: { width: 260 },
  inspector: { width: 240 },
  inspectorPanel: { flexGrow: 1, minWidth: 260 },
  inspectorRow: { flexDirection: "row", gap: 16, maxWidth: 640 },
  monitorGrow: { flex: 1, minWidth: 320 },
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
  stage: { alignItems: "stretch", flexDirection: "row", gap: 12 },
  transportStack: { gap: 14, maxWidth: 760 },
});
