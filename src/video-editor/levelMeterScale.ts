/**
 * The dBFS scale behind {@link LevelMeter}.
 *
 * Audio level is logarithmic and its useful range is asymmetric — the top 12dB
 * matter far more than the bottom 40 — so a meter that maps decibels linearly
 * to width wastes most of its length on silence. This module owns that mapping
 * and the zone boundaries, pure and `react-native`-free so the maths is testable
 * on its own.
 */

/** Quietest level a meter shows by default. Below this the bar is empty. */
export const METER_MIN_DB = -60;

/** Where the meter changes colour, in dBFS. */
export const METER_WARN_DB = -18;
export const METER_PEAK_DB = -6;

/** Which zone a level falls in — the tone a segment paints with. */
export type MeterZone = "peak" | "safe" | "warn";

/**
 * Maps a dBFS level to a `0..1` fraction of the meter's length.
 *
 * The curve is a square root of the linear position rather than the position
 * itself, which stretches the loud end where the detail is and compresses the
 * long quiet tail — the shape a hardware meter has. `-Infinity` (digital
 * silence) and any non-finite reading land at zero rather than off the scale.
 */
export function dbToFraction(db: number, minDb: number = METER_MIN_DB): number {
  if (!Number.isFinite(db)) {
    return db > 0 ? 1 : 0;
  }
  const floor = minDb < 0 ? minDb : METER_MIN_DB;
  if (db <= floor) {
    return 0;
  }
  if (db >= 0) {
    return 1;
  }
  return Math.sqrt((db - floor) / -floor);
}

/** The inverse of {@link dbToFraction}, for reading a value back off a meter. */
export function fractionToDb(
  fraction: number,
  minDb: number = METER_MIN_DB,
): number {
  const floor = minDb < 0 ? minDb : METER_MIN_DB;
  const clamped = Math.min(1, Math.max(0, fraction));
  return floor + clamped * clamped * -floor;
}

/** The zone a level falls in. */
export function zoneForDb(db: number): MeterZone {
  if (db >= METER_PEAK_DB) {
    return "peak";
  }
  return db >= METER_WARN_DB ? "warn" : "safe";
}

/** One coloured band of the meter, as `0..1` fractions of its length. */
export type MeterBand = { end: number; start: number; zone: MeterZone };

/**
 * Splits a level into its coloured bands, so a bar at -3dB paints green up to
 * -18, amber to -6, and red the rest of the way — rather than turning entirely
 * red the moment it gets loud. Returns an empty list for silence.
 */
export function meterBands(
  db: number,
  minDb: number = METER_MIN_DB,
): MeterBand[] {
  const filled = dbToFraction(db, minDb);
  if (filled <= 0) {
    return [];
  }
  const warn = dbToFraction(METER_WARN_DB, minDb);
  const peak = dbToFraction(METER_PEAK_DB, minDb);
  const bands: MeterBand[] = [];
  const push = (start: number, end: number, zone: MeterZone) => {
    if (end > start) {
      bands.push({ end, start, zone });
    }
  };
  push(0, Math.min(filled, warn), "safe");
  push(warn, Math.min(filled, peak), "warn");
  push(peak, filled, "peak");
  return bands;
}

/** Spoken level for a meter channel, e.g. `"Left, −12.0 dB"`. */
export function describeLevel(channel: string, db: number): string {
  if (!Number.isFinite(db)) {
    return `${channel}, silent`;
  }
  // A minus sign rather than a hyphen, so a screen reader says "minus twelve"
  // instead of running the number together with the label.
  const rounded = Math.round(db * 10) / 10;
  return `${channel}, ${rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(1)} dB`;
}

/**
 * Tick levels drawn along a meter's scale, quietest first — the direction the
 * bar itself fills, so a caller can lay them out in order.
 */
export const METER_SCALE_TICKS = [-60, -36, -18, -6, 0] as const;
