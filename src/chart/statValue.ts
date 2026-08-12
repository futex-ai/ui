/**
 * The stat-tile value contract: compaction, and what a delta means.
 *
 * Pure, because "is this delta good?" is a product decision that should be
 * testable without rendering anything — and because getting it wrong paints a
 * rising error rate green.
 */
import { compactNumber } from "./scale/ticks";

/** Whether an increase is a good thing for this metric. */
export type DeltaDirection = "up-is-good" | "down-is-good";

export type DeltaTone = "good" | "bad" | "neutral";

export type StatDelta = {
  /** The change itself, in the metric's own units or as a fraction. */
  value: number;
  /** Render as a percentage rather than a raw number. */
  percent?: boolean;
  /** Names the comparison period, e.g. "vs last month". */
  period?: string;
};

/**
 * Resolve a delta's tone.
 *
 * Colour is direction × whether up is good, never direction alone: revenue up
 * is good, churn up is not, and a chart that paints both green is worse than
 * one with no colour at all. Zero is neutral — "no change" is not a win.
 */
export function deltaTone(
  value: number,
  direction: DeltaDirection = "up-is-good",
): DeltaTone {
  if (!Number.isFinite(value) || value === 0) {
    return "neutral";
  }
  const rising = value > 0;
  const good = direction === "up-is-good" ? rising : !rising;
  return good ? "good" : "bad";
}

/** Format a delta with an explicit sign, so the direction reads at a glance. */
export function formatDelta(delta: StatDelta): string {
  const { value, percent } = delta;
  if (!Number.isFinite(value)) {
    return "—";
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const magnitude = Math.abs(value);
  const body = percent
    ? `${round(magnitude * 100)}%`
    : compactNumber(magnitude);
  return `${sign}${body}`;
}

function round(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

/**
 * Spell a delta out for assistive technology.
 *
 * Direction and tone are separate facts and are reported separately: a metric
 * where down is good can be **down** and **an improvement** at the same time.
 * Deriving the spoken direction from the tone would misreport the number, and
 * naming the tone keeps the good/bad signal from being colour-only (WCAG 2.1 —
 * 1.4.1 Use of Color, A).
 */
export function describeDelta(delta: StatDelta, tone: DeltaTone): string {
  const magnitude = formatDelta(delta).replace(/^[+−]/, "");
  const direction =
    !Number.isFinite(delta.value) || delta.value === 0
      ? "unchanged"
      : delta.value > 0
        ? "up"
        : "down";
  const period = delta.period ? ` ${delta.period}` : "";
  const quality =
    tone === "good" ? ", an improvement" : tone === "bad" ? ", a decline" : "";
  return direction === "unchanged"
    ? `unchanged${period}`
    : `${direction} ${magnitude}${period}${quality}`;
}

/**
 * Format a headline value.
 *
 * Large standalone numbers use the font's **proportional** figures, never
 * `tabular-nums`: equal-width digits make `121` look loose at display sizes.
 * Tabular figures are for columns that must align vertically — table rows and
 * axis ticks — which is where the chart family uses them.
 */
export function formatStatValue(
  value: number,
  format?: (value: number) => string,
): string {
  if (format) {
    return format(value);
  }
  return compactNumber(value);
}

/**
 * Win/loss classification for a sparkline: each point is a win, a loss or a
 * draw against the baseline. Used by the `win-loss` variant, where magnitude is
 * deliberately discarded — the shape of the streak is the story.
 */
export function winLoss(
  data: readonly (number | null)[],
  baseline = 0,
): (1 | -1 | 0 | null)[] {
  return data.map((value) => {
    if (value == null || !Number.isFinite(value)) {
      return null;
    }
    if (value > baseline) {
      return 1;
    }
    return value < baseline ? -1 : 0;
  });
}
