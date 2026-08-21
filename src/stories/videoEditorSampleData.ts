/**
 * The project the video-editor stories assemble around: the timeline sample
 * plus the media, effects, and export options the surrounding panels need.
 *
 * Everything is derived deterministically from the timeline's own sample data,
 * so the Storybook build, the axe sweep, and the Playwright specs see identical
 * output on every run — including the "live" meter levels, which are sampled
 * from the music bed's peaks at the playhead rather than generated randomly.
 */
import { clipEnd, type ScrubberMarker, type TimelineClipData } from "../index";

import {
  sampleClips,
  sampleDuration,
  sampleFrame,
  samplePeaks,
} from "./timelineSampleData";

/** One item in the media bin. */
export type SampleAsset = {
  id: string;
  name: string;
  kind: "audio" | "image" | "video";
  /** Length in seconds. */
  duration: number;
  /** A single representative frame, as an inline SVG data URI. */
  thumbnail: string;
  /** Folder the asset belongs to, for the bin's grouping. */
  group: string;
};

export const sampleAssets: SampleAsset[] = [
  {
    duration: 22,
    group: "Footage",
    id: "asset-harbour",
    kind: "video",
    name: "Harbour wide",
    thumbnail: sampleFrame(196, 4, 12),
  },
  {
    duration: 40,
    group: "Footage",
    id: "asset-interview",
    kind: "video",
    name: "Interview A",
    thumbnail: sampleFrame(28, 6, 12),
  },
  {
    duration: 14,
    group: "Footage",
    id: "asset-cutaway",
    kind: "video",
    name: "Cutaway",
    thumbnail: sampleFrame(142, 3, 12),
  },
  {
    duration: 9,
    group: "Footage",
    id: "asset-drone",
    kind: "video",
    name: "Drone pass",
    thumbnail: sampleFrame(212, 8, 12),
  },
  {
    duration: 120,
    group: "Audio",
    id: "asset-music",
    kind: "audio",
    name: "Music bed",
    thumbnail: sampleFrame(48, 2, 12),
  },
  {
    duration: 9,
    group: "Audio",
    id: "asset-vo",
    kind: "audio",
    name: "VO intro",
    thumbnail: sampleFrame(64, 5, 12),
  },
  {
    duration: 0,
    group: "Graphics",
    id: "asset-logo",
    kind: "image",
    name: "Logo card",
    thumbnail: sampleFrame(320, 1, 12),
  },
];

/** Chapter marks for the transport's scrub bar. */
export const sampleScrubMarkers: ScrubberMarker[] = [
  { id: "chapter-open", label: "Opening", time: 0 },
  { id: "chapter-interview", label: "Interview", time: 8 },
  { id: "chapter-close", label: "Close", time: 15.5, tone: "amber" },
];

/** The frame the preview shows, chosen by which clip the playhead is over. */
export function sampleFrameAt(time: number): string {
  const picture = sampleClips
    .filter((clip) => clip.trackId === "v1")
    .find((clip) => time >= clip.start && time < clipEnd(clip));
  if (!picture?.thumbnails || picture.thumbnails.length === 0) {
    return sampleFrame(210, 0, 1);
  }
  const progress = (time - picture.start) / Math.max(picture.duration, 0.001);
  const index = Math.min(
    picture.thumbnails.length - 1,
    Math.max(0, Math.floor(progress * picture.thumbnails.length)),
  );
  return picture.thumbnails[index];
}

/** The clip the playhead is over on a track, if any. */
export function sampleClipAt(
  clips: readonly TimelineClipData[],
  trackId: string,
  time: number,
): TimelineClipData | undefined {
  return clips.find(
    (clip) =>
      clip.trackId === trackId && time >= clip.start && time < clipEnd(clip),
  );
}

/**
 * Stereo dBFS levels at a playhead position, read off the music bed's own peak
 * data. Deterministic, so a screenshot at a given time always matches — and it
 * genuinely tracks the waveform the timeline is drawing.
 */
const MUSIC_PEAKS = samplePeaks(91, 420);

export function sampleLevelsAt(time: number): number[] {
  const fraction = Math.min(
    0.999,
    Math.max(0, time / Math.max(sampleDuration, 0.001)),
  );
  const index = Math.floor(fraction * MUSIC_PEAKS.length);
  const left = MUSIC_PEAKS[index] ?? 0;
  const right = MUSIC_PEAKS[(index + 7) % MUSIC_PEAKS.length] ?? 0;
  // A 0..1 peak maps onto a -48..-2 dBFS working range.
  const toDb = (peak: number) => -48 + peak * 46;
  return [toDb(left), toDb(right)];
}

/** Peak-hold levels, a touch above the live ones so the markers sit ahead. */
export function samplePeakHoldsAt(time: number): number[] {
  return sampleLevelsAt(time).map((db) => Math.min(-1, db + 4));
}
