/**
 * The accessibility value contract shared by every scrub surface — the ruler
 * here and the {@link Scrubber} in the video-editor family.
 *
 * A scrub surface is a `slider`, and a slider that publishes no value is
 * useless to a screen-reader user. React Native reads `accessibilityValue` on
 * iOS and Android, but react-native-web does **not** translate it into the ARIA
 * range attributes, so the literal `aria-value*` props have to be emitted too.
 * Building both together here keeps them from drifting apart (the same route
 * `progressAccessibility` and `DataGridResizeHandle` take).
 */
import { formatTimecode } from "./timelineTime";

/** What a scrub surface needs to announce itself on every platform. */
export type ScrubAccessibility = {
  /** React Native's value payload, read on iOS and Android. */
  accessibilityValue: {
    max: number;
    min: number;
    now: number;
    text: string;
  };
  /**
   * The ARIA range attributes for web. React Native's `View` prop types omit
   * them, so they are forwarded as literal DOM props via a cast spread.
   */
  webProps: Record<string, unknown>;
};

/**
 * Publishes a playhead position on a whole-frame range, so assistive tech
 * announces a stable integer and reads the spoken value as timecode rather than
 * as a float count of seconds.
 */
export function scrubAccessibility(
  time: number,
  duration: number,
  fps: number,
): ScrubAccessibility {
  const max = Math.max(0, Math.round(duration * fps));
  const now = Math.min(max, Math.max(0, Math.round(time * fps)));
  const text = formatTimecode(now / Math.max(1, fps), fps);
  return {
    accessibilityValue: { max, min: 0, now, text },
    webProps: {
      "aria-valuemax": max,
      "aria-valuemin": 0,
      "aria-valuenow": now,
      "aria-valuetext": text,
    } as Record<string, unknown>,
  };
}

/**
 * Spreadable `role="slider"` for web. `slider` is missing from React Native's
 * `Role` union, though react-native-web forwards the literal to the DOM, so it
 * is cast through a spread and emitted only on web. On native the caller keeps
 * `accessibilityRole="adjustable"`, which is the platform's own equivalent.
 */
export function sliderRoleProps(web: boolean) {
  return web ? ({ role: "slider" } as unknown as { role?: undefined }) : {};
}
