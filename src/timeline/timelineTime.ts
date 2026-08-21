/**
 * Time, timecode, and zoom math for the timeline.
 *
 * Seconds are the canonical unit; `fps` only quantizes onto frame boundaries
 * and formats timecode. Zoom is a single `pixelsPerSecond` scalar, so mapping
 * between a time and an x offset is a multiplication rather than a stateful
 * projection. Pure and `react-native`-free so `node --test` can drive it.
 *
 * Drop-frame timecode is deliberately not modelled: `fps` is treated as a whole
 * number of frames per second, which is what a preview-and-edit UI needs.
 */

/** Frame rate assumed when a caller does not supply one. */
export const DEFAULT_FPS = 30;

/** Guards against a zero/negative/NaN rate reaching the modulus math. */
function safeFps(fps: number): number {
  const rounded = Math.round(fps);
  return Number.isFinite(rounded) && rounded > 0 ? rounded : DEFAULT_FPS;
}

/** Seconds occupied by `frames` at `fps`. */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / safeFps(fps);
}

/** Whole frames covering `seconds`, rounded to the nearest frame. */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * safeFps(fps));
}

/** `seconds` snapped onto the nearest frame boundary. */
export function quantizeToFrame(seconds: number, fps: number): number {
  return secondsToFrames(seconds, fps) / safeFps(fps);
}

/** One frame's length in seconds. */
export function frameDuration(fps: number): number {
  return 1 / safeFps(fps);
}

export type TimecodeOptions = {
  /** Append the `:FF` frame field. Default `true`. */
  showFrames?: boolean;
  /** Include the `HH:` field. Default `true`. */
  showHours?: boolean;
};

function pad(value: number, width = 2): string {
  return String(Math.floor(Math.abs(value))).padStart(width, "0");
}

/**
 * Formats `seconds` as broadcast-style `HH:MM:SS:FF`. Negative times keep a
 * leading `-` so an out-of-range drag still reads correctly.
 */
export function formatTimecode(
  seconds: number,
  fps: number = DEFAULT_FPS,
  options: TimecodeOptions = {},
): string {
  const { showFrames = true, showHours = true } = options;
  const rate = safeFps(fps);
  const sign = seconds < 0 ? "-" : "";
  const totalFrames = Math.round(Math.abs(seconds) * rate);
  const frames = totalFrames % rate;
  const totalSeconds = Math.floor(totalFrames / rate);
  const parts: string[] = [];
  if (showHours) {
    parts.push(pad(Math.floor(totalSeconds / 3600)));
  }
  parts.push(
    pad(
      showHours
        ? Math.floor(totalSeconds / 60) % 60
        : Math.floor(totalSeconds / 60),
    ),
  );
  parts.push(pad(totalSeconds % 60));
  if (showFrames) {
    parts.push(pad(frames));
  }
  return `${sign}${parts.join(":")}`;
}

/**
 * Formats `seconds` as a wall-clock duration — `1:04`, or `1:02:03` once it
 * passes an hour. Used for the compact durations on clips and media items,
 * where a frame field is noise.
 */
export function formatClock(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  const total = Math.round(Math.abs(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const rest = total % 60;
  return hours > 0
    ? `${sign}${hours}:${pad(minutes)}:${pad(rest)}`
    : `${sign}${minutes}:${pad(rest)}`;
}

/**
 * Parses a colon-separated timecode into seconds, reading the fields
 * **right to left** as frames, seconds, minutes, hours — the way an editor's
 * timecode field behaves as you type digits into it. So `"12"` is 12 frames,
 * `"04:12"` is 4s 12f, and `"02:01:04:12"` is 2h 1m 4s 12f. Returns `null` for
 * anything unparseable.
 */
export function parseTimecode(
  text: string,
  fps: number = DEFAULT_FPS,
): number | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  const negative = trimmed.startsWith("-");
  const fields = (negative ? trimmed.slice(1) : trimmed).split(":");
  if (fields.length > 4) {
    return null;
  }
  const values: number[] = [];
  for (const field of fields) {
    if (!/^\d+$/.test(field.trim())) {
      return null;
    }
    values.push(Number(field));
  }
  // Right-to-left: frames, seconds, minutes, hours.
  const [frames = 0, secs = 0, mins = 0, hours = 0] = values.reverse();
  const seconds =
    hours * 3600 + mins * 60 + secs + framesToSeconds(frames, fps);
  return negative ? -seconds : seconds;
}

/** Horizontal offset in px of `time` at the current zoom. */
export function timeToX(time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond;
}

/** The time an x offset in px lands on at the current zoom. */
export function xToTime(x: number, pixelsPerSecond: number): number {
  return pixelsPerSecond > 0 ? x / pixelsPerSecond : 0;
}

/** Major/minor ruler tick spacing, in seconds. */
export type TimelineTickStep = {
  /** Spacing of labelled ticks. */
  major: number;
  /**
   * Spacing of unlabelled ticks. Equal to `major` when the zoom is too tight
   * for a subdivision, which callers read as "draw no minor ticks".
   */
  minor: number;
};

/** Whole-second tick spacings that read as round numbers on a ruler. */
const SECOND_STEPS = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200,
] as const;

/** Sub-second spacings, expressed in frames. */
const FRAME_STEPS = [1, 2, 5, 10, 15] as const;

/**
 * Chooses ruler tick spacing for a zoom level: the smallest step from a ladder
 * of round values whose labels are at least `minMajorPx` apart, so labels never
 * collide and the ruler keeps a familiar 1 / 2 / 5 / 10 rhythm as it zooms from
 * individual frames out to hours.
 */
export function tickStep(
  pixelsPerSecond: number,
  fps: number = DEFAULT_FPS,
  minMajorPx = 76,
): TimelineTickStep {
  const rate = safeFps(fps);
  const ladder: number[] = [];
  for (const frames of FRAME_STEPS) {
    if (frames < rate) {
      ladder.push(frames / rate);
    }
  }
  ladder.push(...SECOND_STEPS);
  const major =
    ladder.find((step) => step * pixelsPerSecond >= minMajorPx) ??
    ladder[ladder.length - 1];
  const candidate = major / 5;
  const minor = candidate >= frameDuration(rate) ? candidate : major;
  return { major, minor };
}

/**
 * Every multiple of `step` within `[from, to]`, ascending. Used for both tick
 * families; an invalid step yields no ticks rather than looping forever.
 */
export function tickTimes(from: number, to: number, step: number): number[] {
  if (!Number.isFinite(step) || step <= 0 || to < from) {
    return [];
  }
  const times: number[] = [];
  const first = Math.ceil(from / step);
  const last = Math.floor(to / step);
  // Guard against a pathological zoom producing millions of ticks.
  if (last - first > 10_000) {
    return [];
  }
  for (let index = first; index <= last; index += 1) {
    times.push(index * step);
  }
  return times;
}

/**
 * Ruler label for `time` at a given major spacing: frames matter only when the
 * ruler is zoomed past one tick per second, and the hours field only appears
 * once the timeline is actually that long.
 */
export function formatRulerLabel(
  time: number,
  fps: number,
  majorStep: number,
): string {
  if (majorStep < 1) {
    return formatTimecode(time, fps, { showHours: false });
  }
  return formatClock(time);
}
