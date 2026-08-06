# Status dot

Promote the pulsing dot buried inside the workflow graph into `StatusDot`, a
standalone primitive any surface can use, and give
[`Badge`](../src/badge/Badge.tsx) a `pulse` prop so the common "● Running" pill
is a one-liner.

**Status:** M1–M3 delivered. `StatusDot` ships from `src/status-dot` on the
badge's four-tone vocabulary with an explicit `pulse` prop, a real `sm`/`md`/`lg`
scale (7 / 9 / 11px), and a decorative-by-default accessible name. The opacity
loop it shares with `Badge` lives in the new `usePulse` hook.
[`WorkflowStatusDot`](../src/workflow/WorkflowNode.tsx) keeps its run-status API
and now delegates. `npm run verify` green.

---

## Background — what already existed

The library owned exactly one pulsing dot: `WorkflowStatusDot`, declared inline
in [`WorkflowNode.tsx`](../src/workflow/WorkflowNode.tsx) and exported through
the workflow barrel. It carried its own `Animated.loop`, its own reduced-motion
guard, and a `status` union (`ok` / `running` / `waiting` / `error` / `skipped`)
that drove the color, the auto-pulse (running only), and the spoken label. Its
`size` prop was accepted and then ignored — the dot was hard-coded 9×9.

[`Badge`](../src/badge/Badge.tsx) owned a second, unrelated dot: a boolean `dot`
prop rendering a static 5 / 6 / 7px circle tinted to the label color.

So a caller who wanted a pill with a live status dot — the pattern this work
started from — had to either import a workflow-namespaced primitive into a
non-workflow surface, or hand-roll the animation.

## Design

### `StatusDot`

A generic dot on the **badge's** tone vocabulary rather than workflow run
semantics, so a dot and the pill beside it are never described in two different
languages. `StatusDotTone` is a type-only alias of `BadgeTone`, which makes drift
impossible.

```ts
export type StatusDotProps = {
  color?: string; // escape hatch; overrides tone
  label?: string; // announced name; omit → decorative
  pulse?: boolean; // default false
  size?: ControlSize; // sm 7 / md 9 (default) / lg 11
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tone?: StatusDotTone; // default "neutral"
};
```

`resolveStatusDotColor` takes the **mid** accents rather than the soft/deep pairs
`resolveBadgeColors` uses, because a dot carries no text of its own:
`neutral → ink2`, `primary → primary`, `warning → amber`, `danger → rose`.

The `md` diameter is deliberately 9px — the workflow dot's hard-coded size — so
the graph is pixel-identical after the move.

### `usePulse`

The animation is shared, not the component: `src/usePulse.ts` owns the loop
(800ms per leg, `Easing.inOut(ease)`, `1 ↔ 0.35`), the `useReducedMotion` guard,
and the native-driver-off-web rule. It returns `{ opacity }` while animating and
`null` otherwise, so a resting dot carries no animated style at all — matching
the behaviour of the code it replaces.

Badge shares the hook, not the component: its dot is an inline 5 / 6 / 7px circle
tinted to the _label_ color, so rendering a `StatusDot` inside it would need size
and color escape hatches to arrive at an identical pixel result.

Module direction is one-way and cycle-free: `badge → usePulse`,
`status-dot → usePulse` plus a type-only `BadgeTone` import.

### Accessibility

The dot is decorative by default (`aria-hidden` on web;
`accessibilityElementsHidden` + `importantForAccessibility` on native), on the
assumption the adjacent text states the status — which is what keeps color from
being the only channel (WCAG 1.4.1). Passing `label` opts into `role="image"`
plus that name. The pulse honours `prefers-reduced-motion` (2.3.3) and its loop
stops on unmount.

This inverts `WorkflowStatusDot`'s default, so the wrapper keeps its own
`decorative` prop and passes `label={decorative ? undefined : ...}`.

## Milestones

### M1 — `StatusDot` and `usePulse`

- `src/usePulse.ts`; `src/status-dot/{StatusDot.tsx,statusDotStyles.ts,index.ts,README.md}`.
- Root export in `src/index.ts` and a `./status-dot` subpath in `package.json`
  (with the matching entry in `packageExports.test.ts`).
- `tests/unit/statusDot.test.ts`; `StatusDot` added to `testIDForwarding.test.ts`.
- A `Status dot/Examples` story so the primitive joins the axe sweep.

### M2 — `Badge` gains `pulse`

- `pulse?: boolean` (default `false`) animating the existing dot through
  `usePulse`. A no-op without `dot`, which the prop doc states and the
  `usePulse(pulse && dot)` call encodes.
- Badge README + story + extended `badge.test.ts`.

### M3 — Workflow delegates

- `WorkflowStatusDot` keeps its props and semantics, rendering `StatusDot` with
  `color={resolveStatusColor(...)}` so `workflowColors` stays the single source
  of truth for graph colors (notably `skipped`, deliberately fainter than a
  neutral dot).
- `createWorkflowStyles` drops its now-unused `statusDot` key — the one
  non-additive detail in this change, and the point of it: leaving a second dot
  geometry behind is exactly the drift being removed.
- Workflow README + updated `workflow.test.ts` source assertions.

## Behaviour changes

- `WorkflowNode` already forwarded `size` to the dot (`WorkflowNode.tsx:203`),
  but the dot ignored it. It now scales: `md` (the default) is unchanged at 9px,
  while `sm` / `lg` graphs get 7 / 11px instead of a fixed 9 — the documented
  behaviour finally working.
- `createWorkflowStyles(...).statusDot` is gone (see M3).

Everything else is additive.

## Testing

`tests/unit/statusDot.test.ts` pins the tone vocabulary and the tone → color
table, the 7 / 9 / 11 scale and `md` default, the decorative-by-default
accessible-name branch, and the exports. `usePulse`'s reduced-motion guard and
unmount teardown are asserted at source. `badge.test.ts` and `workflow.test.ts`
extend to cover `pulse` and the delegation.

Two browser assertions carry the claims a source grep cannot: that the rendered
dots really measure 7 / 9 / 11px (so "pixel-identical at `md`" is proven, not
asserted), and that a pulsing badge dot animates opacity without changing the
pill's height — while a resting dot carries no inline opacity at all. The new
`Status dot/Examples` story also joins the existing axe sweep.
