/**
 * A small but realistic edit for the timeline stories: four tracks, a title
 * card, two picture clips, a dialogue bed, and a music bed.
 *
 * Everything is generated deterministically — no `Math.random`, no network
 * images — so the Storybook build, the axe sweep, and the Playwright specs all
 * see byte-identical output on every run. Waveform peaks come from a seeded
 * linear congruential generator shaped by an envelope, and filmstrip frames are
 * inline SVG data URIs, so the stories render with no assets on disk.
 */
import type {
  TimelineClipData,
  TimelineMarker,
  TimelineTrack,
} from "../timeline";

/**
 * Deterministic pseudo-random peaks in `0..1`, shaped by a slow envelope so the
 * strip reads as speech or music rather than as noise.
 */
export function samplePeaks(seed: number, count: number): number[] {
  const peaks: number[] = [];
  let state = seed >>> 0;
  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const noise = 0.3 + 0.7 * (state / 4294967296);
    const envelope = 0.5 + 0.5 * Math.sin((index / count) * Math.PI * 5);
    peaks.push(Math.min(1, noise * (0.35 + 0.65 * envelope)));
  }
  return peaks;
}

/**
 * An inline SVG frame, so a filmstrip needs no files. The hue identifies the
 * shot and the index shifts the composition, so consecutive frames read as a
 * moving image rather than a repeated tile.
 */
export function sampleFrame(hue: number, index: number, count: number): string {
  const progress = count > 1 ? index / (count - 1) : 0;
  const sky = 38 + Math.round(progress * 16);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="27">` +
    `<rect width="48" height="27" fill="hsl(${hue} 42% ${sky}%)"/>` +
    `<rect y="${18 - progress * 4}" width="48" height="${9 + progress * 4}" fill="hsl(${hue} 34% ${sky - 14}%)"/>` +
    `<circle cx="${6 + progress * 34}" cy="${11 - progress * 3}" r="4" fill="hsl(${(hue + 40) % 360} 62% 74%)"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function frames(hue: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    sampleFrame(hue, index, count),
  );
}

export const sampleTracks: TimelineTrack[] = [
  { id: "v2", kind: "title", name: "Titles" },
  { id: "v1", kind: "video", name: "Picture" },
  { id: "a1", height: 52, kind: "audio", name: "Dialogue" },
  { id: "a2", height: 44, kind: "audio", name: "Music" },
];

export const sampleClips: TimelineClipData[] = [
  {
    duration: 3.5,
    id: "title-open",
    label: "Opening card",
    start: 0,
    trackId: "v2",
  },
  {
    duration: 8,
    id: "shot-harbour",
    label: "Harbour wide",
    sourceDuration: 22,
    sourceIn: 4,
    start: 0,
    thumbnails: frames(196, 18),
    trackId: "v1",
  },
  {
    duration: 6.5,
    id: "shot-interview",
    label: "Interview A",
    sourceDuration: 40,
    sourceIn: 12,
    start: 8,
    thumbnails: frames(28, 18),
    trackId: "v1",
  },
  {
    duration: 5,
    id: "shot-cutaway",
    label: "Cutaway",
    sourceDuration: 14,
    sourceIn: 2,
    start: 15.5,
    thumbnails: frames(142, 14),
    trackId: "v1",
  },
  {
    duration: 6.2,
    id: "vo-intro",
    label: "VO intro",
    peaks: samplePeaks(7, 220),
    sourceDuration: 9,
    sourceIn: 0.5,
    start: 0.4,
    trackId: "a1",
  },
  {
    duration: 7.4,
    id: "vo-answer",
    label: "Interview audio",
    peaks: samplePeaks(23, 260),
    sourceDuration: 40,
    sourceIn: 12,
    start: 8,
    trackId: "a1",
  },
  {
    duration: 19,
    id: "music-bed",
    label: "Music bed",
    locked: true,
    peaks: samplePeaks(91, 420),
    sourceDuration: 120,
    sourceIn: 30,
    start: 0.5,
    tone: "primary",
    trackId: "a2",
  },
];

export const sampleMarkers: TimelineMarker[] = [
  { id: "m-cut", label: "Cut to interview", time: 8 },
  { id: "m-review", label: "Review note", time: 15.5, tone: "amber" },
];

/** Project length in seconds, a beat past the last clip. */
export const sampleDuration = 22;
