/**
 * Sampling for the two content layers drawn inside a clip: the audio waveform
 * and the filmstrip.
 *
 * Both `peaks` and `thumbnails` describe the **whole source**, not the trimmed
 * clip, so trimming a clip's head reveals a different window of the same array
 * rather than requiring fresh data. These helpers map the visible window onto
 * that array and resample it to however many bars or frames actually fit.
 */
import { clipSourceIn, type TimelineClipData } from "./timelineTypes";

/**
 * The source window a clip currently exposes, as a `[0, 1]` fraction of the
 * source. Falls back to the whole source when `sourceDuration` is unknown, so a
 * consumer that supplies peaks without a duration still gets a sensible strip.
 */
export function sourceWindow(clip: TimelineClipData): {
  end: number;
  start: number;
} {
  const total = clip.sourceDuration;
  if (!total || total <= 0) {
    return { end: 1, start: 0 };
  }
  const from = clipSourceIn(clip) / total;
  const to = (clipSourceIn(clip) + clip.duration) / total;
  return {
    end: Math.min(1, Math.max(0, to)),
    start: Math.min(1, Math.max(0, from)),
  };
}

/**
 * Resamples the visible slice of `peaks` down to `barCount` values in `[0, 1]`.
 * Each output bar takes the **maximum** of the samples it covers rather than
 * their mean: a peak meter that averages loses every transient, and the whole
 * point of the strip is to show where the hits are.
 */
export function waveformBars(
  clip: TimelineClipData,
  barCount: number,
): number[] {
  const peaks = clip.peaks;
  if (!peaks || peaks.length === 0 || barCount <= 0) {
    return [];
  }
  const { end, start } = sourceWindow(clip);
  const from = start * peaks.length;
  const to = Math.max(from, end * peaks.length);
  const span = to - from;
  const bars: number[] = [];
  for (let index = 0; index < barCount; index += 1) {
    const sliceStart = from + (span * index) / barCount;
    const sliceEnd = from + (span * (index + 1)) / barCount;
    const first = Math.min(peaks.length - 1, Math.floor(sliceStart));
    const last = Math.min(
      peaks.length - 1,
      Math.max(first, Math.ceil(sliceEnd) - 1),
    );
    let peak = 0;
    for (let sample = first; sample <= last; sample += 1) {
      const value = peaks[sample];
      if (Number.isFinite(value) && value > peak) {
        peak = value;
      }
    }
    bars.push(Math.min(1, Math.max(0, peak)));
  }
  return bars;
}

/**
 * Picks the `frameCount` thumbnails that best represent the visible window,
 * sampled at the centre of each output cell so the strip reads as an even walk
 * through the clip rather than a repeat of its first frame.
 */
export function filmstripFrames(
  clip: TimelineClipData,
  frameCount: number,
): string[] {
  const thumbnails = clip.thumbnails;
  if (!thumbnails || thumbnails.length === 0 || frameCount <= 0) {
    return [];
  }
  const { end, start } = sourceWindow(clip);
  const frames: string[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    const position = start + (end - start) * ((index + 0.5) / frameCount);
    const sample = Math.min(
      thumbnails.length - 1,
      Math.max(0, Math.floor(position * thumbnails.length)),
    );
    frames.push(thumbnails[sample]);
  }
  return frames;
}

/**
 * How many fixed-width cells fit across `width`, capped so a very wide clip at
 * a very tight zoom cannot ask for thousands of nodes.
 */
export function cellsAcross(
  width: number,
  cellWidth: number,
  max = 240,
): number {
  if (width <= 0 || cellWidth <= 0) {
    return 0;
  }
  return Math.min(max, Math.max(1, Math.floor(width / cellWidth)));
}
