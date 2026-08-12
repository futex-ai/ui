/**
 * The shared state behind the video-editor stories.
 *
 * A real editor's host owns the project, the playhead, and the selection; the
 * library owns none of it. This hook is that host, kept out of the story file
 * so the stories stay a description of what to render rather than a lump of
 * bookkeeping.
 *
 * Playback is simulated with an interval that advances the playhead. It starts
 * paused, so a screenshot — or the axe sweep — always sees the same frame.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  applyTimelineEdits,
  DEFAULT_FPS,
  frameDuration,
  quantizeToFrame,
  type TimelineClipData,
  type TimelineEdit,
  type TimelineTool,
  type TimelineTrack,
  type TimelineTrackFlag,
} from "../index";

import {
  sampleClips,
  sampleDuration,
  sampleMarkers,
  sampleTracks,
} from "./timelineSampleData";
import {
  sampleLevelsAt,
  samplePeakHoldsAt,
  sampleFrameAt,
} from "./videoEditorSampleData";

/** How often the simulated playhead advances, in milliseconds. */
const TICK_MS = 100;

export function useVideoEditorHost() {
  const [clips, setClips] = useState<TimelineClipData[]>(sampleClips);
  const [tracks, setTracks] = useState<TimelineTrack[]>(sampleTracks);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([
    "shot-interview",
  ]);
  const [playheadTime, setPlayheadTime] = useState(6.2);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [inPoint, setInPoint] = useState<number | undefined>(undefined);
  const [outPoint, setOutPoint] = useState<number | undefined>(undefined);
  const [tool, setTool] = useState<TimelineTool>("select");
  const [ripple, setRipple] = useState(false);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(44);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    const timer = setInterval(() => {
      setPlayheadTime((current) => {
        const next = current + (TICK_MS / 1000) * rate;
        if (next < sampleDuration) {
          return next;
        }
        if (loop) {
          return inPoint ?? 0;
        }
        setPlaying(false);
        return sampleDuration;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [inPoint, loop, playing, rate]);

  const applyEdit = useCallback(
    (edit: TimelineEdit) =>
      setClips((current) => applyTimelineEdits(current, [edit], { tracks })),
    [tracks],
  );

  const toggleTrack = useCallback(
    (trackId: string, flag: TimelineTrackFlag) =>
      setTracks((current) =>
        current.map((track) =>
          track.id === trackId ? { ...track, [flag]: !track[flag] } : track,
        ),
      ),
    [],
  );

  const stepFrame = useCallback(
    (direction: -1 | 1) =>
      setPlayheadTime((current) =>
        Math.min(
          sampleDuration,
          Math.max(
            0,
            quantizeToFrame(
              current + direction * frameDuration(DEFAULT_FPS),
              DEFAULT_FPS,
            ),
          ),
        ),
      ),
    [],
  );

  const selectedClip = useMemo(
    () => clips.find((clip) => clip.id === selectedClipIds[0]),
    [clips, selectedClipIds],
  );

  return {
    applyEdit,
    clips,
    duration: sampleDuration,
    frameUri: sampleFrameAt(playheadTime),
    inPoint,
    levels: sampleLevelsAt(playheadTime),
    loop,
    markers: sampleMarkers,
    outPoint,
    peakHolds: samplePeakHoldsAt(playheadTime),
    pixelsPerSecond,
    playheadTime,
    playing,
    rate,
    ripple,
    selectedClip,
    selectedClipIds,
    setInPoint,
    setOutPoint,
    setPixelsPerSecond,
    setPlayheadTime,
    setRipple,
    setSelectedClipIds,
    setTool,
    stepFrame,
    tool,
    toggleLoop: () => setLoop((value) => !value),
    togglePlay: () => setPlaying((value) => !value),
    toggleTrack,
    setRate,
    tracks,
  };
}

export type VideoEditorHost = ReturnType<typeof useVideoEditorHost>;
