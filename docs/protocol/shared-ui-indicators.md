# Shared UI Indicators Protocol

The requirements of the shared spinners, loaders, animated borders, avatars,
badges, and status dots. The
[shared UI component protocol](shared-ui-components.md) holds the package
boundary and links every other page.

## Spinner Contract

The spinner family covers the indeterminate loading indicator: a ring whose
accent arc rotates continuously while content is loading.

Required behavior:

- Render a circular ring sized by the shared `ControlSize` scale (`sm` / `md` /
  `lg`, with `md` as the default) or by an explicit pixel diameter, deriving the
  ring stroke thickness from the diameter.
- Animate a continuous rotation with the same component on native and web, and
  stop the loop on unmount.
- Expose `progressbar` accessibility semantics with a busy state and an
  accessible name that defaults to a loading label.
- Use shared theme tokens for the accent arc (`primary`) and the ring track
  (`border2`), and allow per-instance `color` and `trackColor` overrides for
  alternate surfaces without forking the component.
- Keep only the inner ring rotating so the labelled container keeps a stable box
  for layout and assistive technology.
- Honour the user's "reduce motion" preference by slowing the loop right down
  and fading the ring in place instead of rotating it. The indicator must keep
  animating: a frozen spinner reads as a hung screen.

## Loader Contract

The loader family covers the rest of the loading vocabulary: an indeterminate
indicator with a switchable shape, and the two determinate progress meters.

Required behavior:

- Render `Loader` in any of six shapes — `ring`, `dot-grid`, `dots`, `bars`,
  `blades`, `pulse` — defaulting to `ring`.
- Size every shape's box height from the same scale the spinner uses (`sm` /
  `md` / `lg`, `md` default, or an explicit pixel size) so a shape can be
  swapped for another without moving the surrounding layout. `dots` and `bars`
  may be wider than they are tall; the rest are square.
- Make `variant="ring"` identical to the spinner.
- Give each shape a default cycle length suited to its motion, overridable per
  instance with `duration`.
- Animate every shape identically on native and web, and stop its loop on
  unmount. On iOS and Android the animation keeps running while the JavaScript
  thread is busy. The staggered elements of a shape never drift apart.
- Honour "reduce motion" by slowing the loop and animating brightness alone —
  no translation, scale, or rotation — rather than freezing.
- Expose `progressbar` accessibility semantics with a busy state and an
  accessible name that defaults to a loading label. The shape itself is
  decorative and must stay out of the accessibility tree.
- Use shared theme tokens for the animated elements (`primary`) and tracks
  (`border2`), with per-instance `color` and `trackColor` overrides.

`ProgressBar` and `ProgressRing` cover progress whose total is known:

- `ProgressBar` renders a full-width track. A `value` prop, a 0–1 fraction
  clamped to range, makes it determinate; omitting `value` sweeps a segment
  across the track for unknown progress.
- `ProgressRing` renders the determinate circular meter, sharing the spinner's
  geometry so it can replace a spinner of the same size without moving the
  layout. Its arc starts at 12 o'clock and fills clockwise.
- Both publish the percentage through `aria-valuenow` on ARIA's default 0–100
  range, so screen readers announce a percentage rather than a fraction. An
  indeterminate bar publishes a busy state and no value, per ARIA.
- Expose the value on both platforms: through React Native's
  `accessibilityValue` on native, and through the literal `aria-value*`
  attributes on web. This applies to any determinate control, not only these
  two.

## Animated Border Contract

The animated border covers the decorative "working" highlight: a comet trail
that traces the perimeter of the element it frames, marking an active tool icon,
avatar, or card while work is running.

Required behavior:

- Trace the real rounded-rectangle path of the framed box, sized by `width` /
  `height` (or a square `size`) and `borderRadius`, so the trail follows the
  same corner radius as the element it frames. `shape="circle"` fully rounds the
  box instead — a true circle when square, an elongated stadium ("pill") when
  not — and ignores `borderRadius`.
- Draw the trail as a short, bright head leading progressively fainter, longer
  tail segments. Decision: the trail follows the real path, rather than a CSS
  gradient border, which cannot bend around a corner, or a single rotated dash,
  which only reads as motion on a circle.
- Animate the trail on native and web, and stop the loop on unmount.
- Accept `color` as either a single color or a `[from, to]` pair, defaulting to
  the theme `primary`. A pair strokes the trail with an SVG gradient sweeping
  `from → to → from` across the box, so a border can carry a consumer's brand
  pair and identify which connected app is working, not merely that something
  is. `from` is repeated at both ends so the two sides of the border read the
  same rather than ramping one way across it.
- Treat a pair of identical colors as the single-color case — solid, with no
  gradient defined — so a caller holding one brand color can repeat it instead
  of branching. On web, each border paints its own gradient, also when several
  borders share a page.
- Keep the border out of the accessibility tree on every platform and let
  pointer events pass through to the content it overlays. It is decoration; the
  surrounding control owns the announced state.
- Honour the user's "reduce motion" preference by settling into a static
  outline — stroked with the same color or gradient — instead of looping the
  trail around the perimeter.
- Wrap `children` and overlay the border over them, or render standalone (with
  no children) for the caller to position over an existing box.

## Avatar Contract

The avatar family covers the compact initials badge used to represent a person
or entity, as either a circular disc or a rounded square.

Required behavior:

- Render a disc or a rounded square with one or two initials centered on it.
- Drive the box, the corner radius, and the initials' font size from a single
  `size` prop so every avatar scales proportionally.
- Offer two shapes: `circle` (the default, radius `size / 2`) and `square`,
  whose radius is `size * radii.avatarRatio` — a theme ratio token (default
  `0.25`) clamped to `[0, 0.5]` so the corner reads identically at every size.
- Support a solid tone (primary-filled disc with white initials) and a soft tone
  (soft-tinted disc with deep-primary initials).
- Offer an indeterminate `loading` state that replaces the initials in place
  with the loader family's `dot-grid` shape, drawn in the same foreground color
  the initials would have used. The disc keeps its fill, corner, and footprint
  so a row of avatars does not reflow, and it reports itself as a busy
  progress indicator rather than an image for as long as it is loading.
- Use shared theme tokens for the disc backgrounds, the initials' color, and the
  initials' font, with no consumer-local theme imports.
- Accept an optional accessible name and a container style override without
  requiring consumers to fork the component.
- Accept an optional initials color override so consumer-provided palette discs
  can keep matching palette-specific foreground colors.

## Badge Contract

The badge family covers the compact, non-interactive status pill that labels a
status (e.g. `Active`, `Pending`, `Overdue`) with a themed tone.

Required behavior:

- Render a content-hugging, fully-rounded pill around one short label, sized on
  the shared `ControlSize` scale (`sm` / `md` (default) / `lg`).
- Carry a semantic status `tone` — `neutral` (default), `primary`, `warning`,
  and `danger` — in a `soft` (tinted fill, deep accent text) or `solid` (filled
  accent, white text) variant. There is no `success` or `info` tone, because the
  shared theme exposes no green or blue accent distinct from the brand
  `primary`; a status badge maps onto the existing accent families.
- Keep every tone/variant pair at the WCAG 1.4.3 AA text-contrast minimum
  (≥4.5:1) on its own fill in both shipped themes, using the deep
  `amberDeep` / `roseDeep` accents for the warning and danger tones.
- Keep the visible label text as the status channel so the tone color reinforces
  rather than solely conveys the meaning, with an optional accessibility-label
  override for abbreviated or numeric labels.
- Offer an optional leading status dot, tinted to the resolved label color (or a
  custom color), which may `pulse` for a live state through the same shared halo
  as the status dot family.
- Use shared theme tokens for the fills, the label color, the font, and the pill
  radius, with no consumer-local theme imports.

## Status Dot Contract

The status dot family covers the small round state indicator that sits beside a
label — in a list row, a table cell, a header, or inside a badge.

Required behavior:

- Render a circle sized on the shared `ControlSize` scale (`sm` / `md`
  (default) / `lg`), where `md` matches the workflow graph's run-status dot so
  the two families cannot diverge.
- Carry the `Badge` tone vocabulary (`neutral` (default), `primary`, `warning`,
  `danger`), so a dot and the pill beside it describe a status in one language.
  A dot has no text of its own, so it takes the mid accent rather than a
  soft-fill/deep-text pair.
- Accept a custom color for a caller-owned palette the semantic tones do not
  cover — the route by which the workflow graph keeps its own status palette.
- Offer an optional `pulse` that swells a translucent halo out of the dot and
  fades it — the design system's live-state ping — while the dot itself stays
  solid. The halo overflows the dot (and any pill around it) without affecting
  layout, the badge dot pulses with the same halo, it is decorative, and under
  reduced motion it is not drawn at all (2.3.3). Its loop stops on unmount.
- Stay decorative unless given a label, on the assumption the adjacent text
  states the status; a labelled dot reports as an `image` with that name, so the
  status is never carried by color alone (WCAG 1.4.1).
- Use shared theme tokens for the fill and the radius, with no consumer-local
  theme imports.
