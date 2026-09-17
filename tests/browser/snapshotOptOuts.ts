/**
 * Stories the visual snapshot sweep (`snapshots.spec.ts`) cannot pin, each with
 * the reason it is not pinnable. This is the single place an opt-out may be
 * declared, so the sweep's blind spots stay visible in one file.
 *
 * Opting a story out of its screenshot is the last resort. The sweep removes
 * most motion before it reaches this list: every story renders in a context with
 * `reducedMotion: "reduce"`, so components built on `useReducedMotion` stop
 * animating; `toHaveScreenshot` runs with `animations: "disabled"` (CSS
 * animations and transitions are fast-forwarded to their end state) and
 * `caret: "hide"`; and it re-shoots until a frame matches the baseline. That is
 * enough for the animated border, the skeleton sheen and the status-dot pulse,
 * which all honour reduced motion. What survives is a `requestAnimationFrame`
 * loop with no reduced-motion opinion — React Native's `Animated` writes inline
 * styles, which no browser-level motion switch can freeze — so the story never
 * settles on the recorded frame.
 *
 * An ARIA opt-out is a different problem: Playwright stores an ARIA baseline as
 * a YAML file and reads an empty file as a missing one, so a story whose
 * accessibility tree is legitimately empty (unlabelled decorative boxes) can
 * never have a baseline written, and would fail every run.
 *
 * No story is opted out for reading the wall clock. A throwaway probe rendered
 * all 326 stories twice, once with `page.clock.setFixedTime` at
 * 2026-06-17T09:00Z and once at 2027-02-03T21:45Z, and diffed the rendered
 * text of `#storybook-root`. Exactly one story differed, and only because its
 * data grid streams rows in on a timer rather than because of the date; the
 * story files pin their own instants (see the `TODAY` / `NOW` constants in
 * `src/stories/calendar.stories.tsx`). The sweep therefore needs no clock
 * control.
 */
export type SnapshotOptOut = Readonly<{
  /** One line: why this story cannot be pinned. */
  reason: string;
  /**
   * What the sweep skips. `"screenshot"` keeps the ARIA snapshot, because
   * motion moves pixels and not the accessibility tree; `"aria"` keeps the
   * screenshot; `"story"` skips both, for markup that is itself
   * non-deterministic.
   */
  scope: "aria" | "screenshot" | "story";
}>;

export const SNAPSHOT_OPT_OUTS: Readonly<Record<string, SnapshotOptOut>> = {
  "skeleton-examples--composed-card": {
    reason:
      "Placeholder blocks carry no accessible role, so the tree is empty.",
    scope: "aria",
  },
  "skeleton-examples--composed-row": {
    reason:
      "Placeholder blocks carry no accessible role, so the tree is empty.",
    scope: "aria",
  },
  "status-dot-examples--sizes": {
    reason: "Unlabelled dots carry no accessible role, so the tree is empty.",
    scope: "aria",
  },
};

/** The opt-out recorded for `storyId`, or `undefined` when the story is pinned. */
export function snapshotOptOut(storyId: string): SnapshotOptOut | undefined {
  return SNAPSHOT_OPT_OUTS[storyId];
}
