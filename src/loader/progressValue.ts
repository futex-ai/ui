/**
 * The value contract shared by {@link ProgressBar} and {@link ProgressRing}.
 *
 * Both take progress as a 0–1 fraction but publish it on ARIA's default 0–100
 * range, so assistive technology announces "42%" rather than "0.42".
 *
 * The two platforms need different props for that. React Native reads
 * `accessibilityValue` on iOS and Android, but react-native-web does **not**
 * translate it into the ARIA range attributes — a web screen reader would reach
 * a `progressbar` carrying no value at all. Both have to be emitted, so they are
 * built together here and the two components cannot drift apart.
 */

/** Top of the published range — ARIA's default for a progressbar. */
export const PROGRESS_MAX = 100;

/** What a determinate meter needs to announce itself on every platform. */
export type ProgressAccessibility = {
  /** React Native's value payload, read on iOS and Android. */
  accessibilityValue: {
    max: number;
    min: number;
    now: number;
    text: string;
  };
  /** The published 0–100 percentage, also useful for visible captions. */
  percent: number;
  /**
   * The ARIA range attributes for web. React Native's `View` prop types omit
   * them, so they are forwarded as literal DOM props via a cast spread — the
   * same route `DataGridResizeHandle` takes for its separator.
   */
  webProps: Record<string, unknown>;
};

/** Keep a caller-supplied fraction inside 0–1, treating a non-finite value as 0. */
export function clampFraction(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Build the cross-platform accessibility payload for a 0–1 progress fraction. */
export function progressAccessibility(fraction: number): ProgressAccessibility {
  const percent = Math.round(clampFraction(fraction) * PROGRESS_MAX);
  const text = `${percent}%`;
  return {
    accessibilityValue: { max: PROGRESS_MAX, min: 0, now: percent, text },
    percent,
    webProps: {
      "aria-valuemax": PROGRESS_MAX,
      "aria-valuemin": 0,
      "aria-valuenow": percent,
      "aria-valuetext": text,
    } as Record<string, unknown>,
  };
}
