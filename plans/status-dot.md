# Status dot

Promote the pulsing dot buried inside the workflow graph into `StatusDot`, a
standalone primitive any surface can use, and give
[`Badge`](../src/badge/Badge.tsx) a `pulse` prop so the common "● Running" pill
is a one-liner.

**Status:** M1–M4 delivered. `StatusDot` ships from `src/status-dot` on the
badge's four-tone vocabulary with an explicit `pulse` prop, a real `sm`/`md`/`lg`
scale (7 / 9 / 11px), and a decorative-by-default accessible name. The ping it
shares with `Badge` lives in the new `PulseHalo` component.
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

### `PulseHalo`

The pulse is the design system's live-state ping, taken from the `mcpulse`
keyframes in the Juno mockups (`docs/mockups/app/styles.css`):

```css
.mc-ph-pill i {
  width: 6px;
  height: 6px;
  background: var(--good);
  animation: mcpulse 1.6s ease-in-out infinite;
}
@keyframes mcpulse {
  0% {
    box-shadow: 0 0 0 0 rgba(79, 166, 114, 0.5);
  }
  70% {
    box-shadow: 0 0 0 7px rgba(79, 166, 114, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(79, 166, 114, 0);
  }
}
```

The dot stays **solid**; a translucent halo radiates out of it and fades. React
Native cannot animate a `box-shadow` spread, so `src/status-dot/PulseHalo.tsx`
draws the equivalent: an absolutely-positioned circle behind the dot that scales
1 → 3⅓ while its opacity goes 0.5 → 0 across the first 70% of a 1.6s cycle, then
rests. Transform and opacity both run on the native driver — the same trade
`PulseLoader` makes.

The 7px spread becomes a **ratio** (20 / 6, from the mockup's 6px dot) so the
halo tracks the dot across the `ControlSize` scale. At the badge's 6px `md` dot
that is pixel-identical to the mockup.

This is a component rather than a hook because the ping is an extra element, not
a style a dot can wear: it has to paint _behind_ the dot and grow past its
bounds. So `StatusDot` and the badge dot each split into a layout box plus a
`fill` circle, with the halo sandwiched between them. Badge shares the halo, not
`StatusDot` itself: its dot is an inline 5 / 6 / 7px circle tinted to the _label_
color, so nesting a whole `StatusDot` would need size and color escape hatches to
land on the same pixels.

Module direction is one-way and cycle-free: `badge → status-dot/PulseHalo`, plus
a type-only `BadgeTone` import back the other way.

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

### M1 — `StatusDot` and the shared pulse

- `src/status-dot/{StatusDot.tsx,PulseHalo.tsx,statusDotStyles.ts,index.ts,README.md}`.
- Root export in `src/index.ts` and a `./status-dot` subpath in `package.json`
  (with the matching entry in `packageExports.test.ts`).
- `tests/unit/statusDot.test.ts`; `StatusDot` added to `testIDForwarding.test.ts`.
- A `Status dot/Examples` story so the primitive joins the axe sweep.

### M2 — `Badge` gains `pulse`

- `pulse?: boolean` (default `false`) rendering a `PulseHalo` behind the existing
  dot. A no-op without `dot`, which the prop doc states and the JSX encodes by
  nesting the halo inside the dot's own branch.
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

### M4 — Match the mockup's ping

The first cut animated the dot's own opacity (1 ↔ 0.35) with no halo, which is
not what the design system does. Reworked to the `mcpulse` ping described above:
`usePulse` is gone, replaced by `PulseHalo`; both dots split into a box plus a
`fill`; the browser assertion now polls the halo's transform and pins that the
fill never dims.

## Behaviour changes

- `WorkflowNode` already forwarded `size` to the dot (`WorkflowNode.tsx:203`),
  but the dot ignored it. It now scales: `md` (the default) is unchanged at 9px,
  while `sm` / `lg` graphs get 7 / 11px instead of a fixed 9 — the documented
  behaviour finally working.
- `createWorkflowStyles(...).statusDot` is gone (see M3).
- The workflow graph's `running` dot changes appearance: it was a dot fading its
  own opacity, and is now a solid dot with the halo ping. That is the point of a
  single pulse vocabulary, but it is a visible change to a shipped surface.

Everything else is additive.

## Testing

`tests/unit/statusDot.test.ts` pins the tone vocabulary and the tone → color
table, the 7 / 9 / 11 scale and `md` default, the decorative-by-default
accessible-name branch, and the exports. The halo's `mcpulse` constants, its
reduced-motion guard, and its unmount teardown are asserted at source. `badge.test.ts` and `workflow.test.ts`
extend to cover `pulse` and the delegation.

Two browser assertions carry the claims a source grep cannot: that the rendered
dots really measure 7 / 9 / 11px (so "pixel-identical at `md`" is proven, not
asserted), and that a pulsing badge dot animates opacity without changing the
pill's height — while a resting dot carries no inline opacity at all. The new
`Status dot/Examples` story also joins the existing axe sweep.
