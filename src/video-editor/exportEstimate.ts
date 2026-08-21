/**
 * Export estimates and the settings vocabulary behind {@link ExportDialog}.
 *
 * Nothing here encodes anything — the numbers are the arithmetic a consumer
 * would otherwise write inline to answer "how big will this be, and how long
 * will it take". Pure and free of any runtime `react-native` import.
 */
import { formatClock } from "../timeline/timelineTime";

/** Container formats an export can target. */
export type ExportFormat = "gif" | "mov" | "mp4" | "webm";

/** Everything the dialog edits. */
export type ExportSettings = {
  format: ExportFormat;
  width: number;
  height: number;
  fps: number;
  /** Video bitrate in kilobits per second. */
  videoBitrateKbps: number;
  /** Audio bitrate in kilobits per second. `0` exports silent. */
  audioBitrateKbps: number;
  /** Whether to export the whole sequence or only the marked range. */
  range: "in-out" | "whole";
};

/** A named bundle of settings. */
export type ExportPreset = {
  id: string;
  label: string;
  /** The fields the preset fixes; anything it omits is left as it was. */
  settings: Partial<ExportSettings>;
  /** Short caption, e.g. `"1080p · H.264"`. */
  detail?: string;
};

/**
 * Estimated file size in **bytes**.
 *
 * Bitrate is bits per second, so the whole calculation is
 * `(video + audio) × seconds ÷ 8`. Container overhead is real but small and
 * format-specific; leaving it out keeps the estimate honest about being an
 * estimate rather than pretending to a precision it does not have.
 */
export function estimateFileSize(
  durationSeconds: number,
  videoBitrateKbps: number,
  audioBitrateKbps: number,
): number {
  const seconds = Math.max(0, durationSeconds);
  const kbps = Math.max(0, videoBitrateKbps) + Math.max(0, audioBitrateKbps);
  return (kbps * 1000 * seconds) / 8;
}

/** A byte count as a short human string — `"482 MB"`, `"1.2 GB"`. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }
  const units = [
    { label: "GB", size: 1000 ** 3 },
    { label: "MB", size: 1000 ** 2 },
    { label: "kB", size: 1000 },
  ];
  for (const unit of units) {
    if (bytes >= unit.size) {
      const value = bytes / unit.size;
      // One decimal below ten, none above: "1.2 GB" but "482 MB".
      return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit.label}`;
    }
  }
  return `${Math.round(bytes)} B`;
}

/**
 * Estimated encode time in seconds. `speedFactor` is how many seconds of
 * footage the encoder gets through per second of wall clock — above one is
 * faster than real time.
 */
export function estimateEncodeSeconds(
  durationSeconds: number,
  speedFactor: number,
): number {
  if (!Number.isFinite(speedFactor) || speedFactor <= 0) {
    return 0;
  }
  return Math.max(0, durationSeconds) / speedFactor;
}

/**
 * A rough time as words — an estimate should not claim to the second. Anything
 * under a minute rounds to "under a minute" rather than a false precision.
 */
export function formatEstimatedTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "less than a minute";
  }
  if (seconds < 60) {
    return "less than a minute";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  const hours = Math.round(seconds / 3600);
  return `about ${hours} hour${hours === 1 ? "" : "s"}`;
}

/** The span an export covers, honouring the in/out marks when asked to. */
export function exportDuration(
  settings: Pick<ExportSettings, "range">,
  duration: number,
  inPoint?: number,
  outPoint?: number,
): number {
  if (
    settings.range === "in-out" &&
    inPoint !== undefined &&
    outPoint !== undefined
  ) {
    return Math.max(0, Math.abs(outPoint - inPoint));
  }
  return Math.max(0, duration);
}

/** `"1080p"` for the standard heights, otherwise `"1920×1080"`. */
export function resolutionLabel(width: number, height: number): string {
  const standard: Record<number, string> = {
    360: "360p",
    480: "480p",
    720: "720p",
    1080: "1080p",
    1440: "1440p",
    2160: "4K",
  };
  const known = standard[height];
  // Only claim a standard name at the matching 16:9 width; a 1080-tall square
  // is not "1080p".
  return known && Math.abs(width / height - 16 / 9) < 0.02
    ? known
    : `${width}×${height}`;
}

/** The one-line summary the dialog shows above its actions. */
export function describeExport(
  settings: ExportSettings,
  durationSeconds: number,
  speedFactor = 2,
): string {
  const size = formatFileSize(
    estimateFileSize(
      durationSeconds,
      settings.videoBitrateKbps,
      settings.audioBitrateKbps,
    ),
  );
  const time = formatEstimatedTime(
    estimateEncodeSeconds(durationSeconds, speedFactor),
  );
  return `${formatClock(durationSeconds)} · ${resolutionLabel(
    settings.width,
    settings.height,
  )} · ${settings.format.toUpperCase()} · about ${size}, ${time}`;
}
