/**
 * The multi-track timeline.
 *
 * Fully controlled: it owns no clip data. Tracks, clips, the playhead, the zoom
 * and the selection all arrive as props, and every gesture is reported back —
 * seeks through `onSeek`, selection through `onSelectionChange`, header toggles
 * through `onTrackToggle`, and edits through `onEdit`. `applyTimelineEdits` is
 * exported alongside as the canonical reducer, so a consumer gets ripple and
 * magnetic behaviour without reimplementing it.
 *
 * The ruler, the lanes, and the playhead all live inside one horizontal
 * `ScrollView` while the track-header gutter is pinned outside it, so a single
 * scroll offset keeps every layer in register with no scroll-sync code.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import type { FocusableRef } from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";

import { TimelineClip, type TimelineClipKeyEvent } from "./TimelineClip";
import { TimelinePlayhead } from "./TimelinePlayhead";
import { TimelineRuler } from "./TimelineRuler";
import {
  TimelineTrackHeader,
  type TimelineTrackFlag,
} from "./TimelineTrackHeader";
import { nextFocusedClipId, trackOrderOf } from "./timelineKeyboardModel";
import {
  clipRect,
  contentWidth,
  trackLayouts,
  tracksHeight,
  visibleClips,
} from "./timelineLayout";
import {
  createTimelineStyles,
  defaultToneForKind,
  resolveClipColors,
  timelineSizing,
} from "./timelineStyles";
import { DEFAULT_FPS, xToTime } from "./timelineTime";
import type {
  TimelineClipData,
  TimelineMarker,
  TimelineTrack,
} from "./timelineTypes";

/** `data-testid` prefix carried by every clip, so a drag can find it by rect. */
export const CLIP_TESTID_PREFIX = "timeline-clip-";

export type TimelineProps = {
  tracks: readonly TimelineTrack[];
  clips: readonly TimelineClipData[];
  /** Project length in seconds. The content is never shorter than this. */
  duration: number;
  /** Playhead position in seconds. */
  playheadTime: number;
  /** Zoom. Default `60` — one second per 60px. */
  pixelsPerSecond?: number;
  /** Frame rate for quantizing and timecode. Default `30`. */
  fps?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Named points on the ruler; also snap targets for edits. */
  markers?: readonly TimelineMarker[];
  /** Ids of the currently selected clips. */
  selectedClipIds?: readonly string[];
  /** Height cap in px; beyond it the lanes scroll vertically. */
  maxHeight?: number;
  /** Show grab affordances at clip edges. Default `true` when `onEdit` is set. */
  trimmable?: boolean;

  onSeek?: (time: number) => void;
  onSelectionChange?: (clipIds: string[]) => void;
  onClipPress?: (clip: TimelineClipData) => void;
  onTrackToggle?: (trackId: string, flag: TimelineTrackFlag) => void;

  /** Placeholder when there are no tracks at all. */
  emptyLabel?: string;
  disableFocusRing?: boolean;
  /** Names the whole timeline as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Seconds of empty runway kept past the end, so there is room to drag into. */
const TRAILING_RUNWAY = 2;

export function Timeline({
  accessibilityLabel,
  clips,
  disableFocusRing = false,
  duration,
  emptyLabel = "No tracks yet",
  fps = DEFAULT_FPS,
  markers = [],
  maxHeight,
  onClipPress,
  onSeek,
  onSelectionChange,
  onTrackToggle,
  pixelsPerSecond = 60,
  playheadTime,
  selectedClipIds = [],
  size = "md",
  style,
  testID,
  tracks,
  trimmable = true,
}: TimelineProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const metrics = timelineSizing[size];

  const layouts = useMemo(
    () => trackLayouts(tracks, metrics.trackHeight, metrics.trackGap),
    [tracks, metrics.trackHeight, metrics.trackGap],
  );
  const lanesHeight = tracksHeight(layouts);
  const width = useMemo(
    () => contentWidth(clips, duration, pixelsPerSecond, TRAILING_RUNWAY),
    [clips, duration, pixelsPerSecond],
  );

  // Only the clips overlapping the scrolled window are rendered, so a long
  // project costs the same as a short one. The window is tracked in state
  // because the scroll offset is the only thing that changes as it moves.
  const [viewport, setViewport] = useState({
    end: Number.POSITIVE_INFINITY,
    start: 0,
  });
  const shown = useMemo(
    () => visibleClips(clips, viewport.start, viewport.end),
    [clips, viewport.end, viewport.start],
  );

  const selected = useMemo(() => new Set(selectedClipIds), [selectedClipIds]);
  const trackById = useMemo(() => {
    const map = new Map<string, TimelineTrack>();
    for (const track of tracks) {
      map.set(track.id, track);
    }
    return map;
  }, [tracks]);

  // Roving focus: the lane stack is one Tab stop and the arrows move which clip
  // holds it, rather than every clip being its own stop.
  const [focusedClipId, setFocusedClipId] = useState<string | null>(null);
  const clipNodes = useRef(new Map<string, FocusableRef>());
  const activeClipId =
    focusedClipId && clips.some((clip) => clip.id === focusedClipId)
      ? focusedClipId
      : (shown[0]?.id ?? null);

  const trackOrder = useMemo(() => trackOrderOf(layouts), [layouts]);

  const handleClipKeyDown = useCallback(
    (event: TimelineClipKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key) {
        return;
      }
      const next = nextFocusedClipId(key, activeClipId, clips, trackOrder);
      if (!next) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      setFocusedClipId(next);
      clipNodes.current.get(next)?.focus?.();
    },
    [activeClipId, clips, trackOrder],
  );

  const handleClipPress = useCallback(
    (clip: TimelineClipData) => {
      setFocusedClipId(clip.id);
      onSelectionChange?.([clip.id]);
      onClipPress?.(clip);
    },
    [onClipPress, onSelectionChange],
  );

  const handleScroll = useCallback(
    (offsetX: number, viewWidth: number) => {
      const start = xToTime(offsetX, pixelsPerSecond);
      setViewport({
        end: start + xToTime(viewWidth, pixelsPerSecond),
        start,
      });
    },
    [pixelsPerSecond],
  );

  if (tracks.length === 0) {
    return (
      <View style={[styles.root, style]} testID={testID}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  const lanes = (
    <View style={[styles.lanes, { height: lanesHeight, width }]}>
      {layouts.map((layout) => {
        const track = trackById.get(layout.trackId);
        return (
          <View
            aria-hidden
            key={layout.trackId}
            style={[
              styles.lane,
              { height: layout.height, top: layout.top },
              layout.index % 2 === 1 ? styles.laneOdd : null,
              track?.hidden ? styles.laneHidden : null,
            ]}
          />
        );
      })}
      {shown.map((clip) => {
        const rect = clipRect(clip, layouts, pixelsPerSecond);
        const track = trackById.get(clip.trackId);
        if (!rect || !track) {
          return null;
        }
        return (
          <TimelineClip
            clip={clip}
            colors={resolveClipColors(
              theme,
              clip.tone ?? defaultToneForKind(track.kind),
            )}
            disableFocusRing={disableFocusRing}
            fps={fps}
            key={clip.id}
            onFocus={() => setFocusedClipId(clip.id)}
            onKeyDown={handleClipKeyDown}
            onPress={handleClipPress}
            rect={rect}
            registerRef={(node) => {
              if (node) {
                clipNodes.current.set(clip.id, node as FocusableRef);
              } else {
                clipNodes.current.delete(clip.id);
              }
            }}
            selected={selected.has(clip.id)}
            size={size}
            tabIndex={clip.id === activeClipId ? 0 : -1}
            testID={`${CLIP_TESTID_PREFIX}${clip.id}`}
            trackName={track.name}
            trimmable={trimmable && !track.locked}
          />
        );
      })}
    </View>
  );

  const scroller = (
    <ScrollView
      horizontal
      onLayout={(event) => handleScroll(0, event.nativeEvent.layout.width)}
      onScroll={(event) =>
        handleScroll(
          event.nativeEvent.contentOffset.x,
          event.nativeEvent.layoutMeasurement.width,
        )
      }
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={Platform.OS === "web"}
    >
      <View style={{ width }}>
        <TimelineRuler
          disableFocusRing={disableFocusRing}
          duration={duration}
          fps={fps}
          markers={markers}
          onSeek={onSeek}
          pixelsPerSecond={pixelsPerSecond}
          playheadTime={playheadTime}
          size={size}
          testID={testID ? `${testID}-ruler` : undefined}
          width={width}
        />
        {lanes}
        <TimelinePlayhead
          height={lanesHeight}
          pixelsPerSecond={pixelsPerSecond}
          rulerHeight={metrics.rulerHeight}
          time={playheadTime}
        />
      </View>
    </ScrollView>
  );

  const body = (
    <View style={styles.body}>
      <View style={[styles.gutter, { width: metrics.headerWidth }]}>
        <View
          aria-hidden
          style={[styles.gutterSpacer, { height: metrics.rulerHeight }]}
        />
        <View style={{ gap: metrics.trackGap }}>
          {layouts.map((layout) => {
            const track = trackById.get(layout.trackId);
            return track ? (
              <TimelineTrackHeader
                disableFocusRing={disableFocusRing}
                height={layout.height}
                key={track.id}
                onToggle={onTrackToggle}
                size={size}
                track={track}
                width={metrics.headerWidth}
              />
            ) : null;
          })}
        </View>
      </View>
      {scroller}
    </View>
  );

  return (
    <View
      aria-label={accessibilityLabel}
      // A labelled `group` names the region without collapsing the clips into
      // one node the way `accessible` would on native.
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, maxHeight ? { maxHeight } : null, style]}
      testID={testID}
    >
      {maxHeight ? <ScrollView>{body}</ScrollView> : body}
    </View>
  );
}
