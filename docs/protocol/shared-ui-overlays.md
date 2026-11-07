# Shared UI Overlays Protocol

The requirements of the shared dropdowns and toasts. Dialog behavior,
stacking, and layers are in the [web overlays protocol](web-overlays.md).
The [shared UI component protocol](shared-ui-components.md) holds the
package boundary and links every other page.

## Dropdown Contract

The dropdown family covers three related surfaces:

- Button-backed selectors and action menus.
- Read-only selector-shaped controls.
- Input-backed combobox popovers and chip multi-selects.

Required behavior:

- Measure an anchor and render a portal surface that escapes ordinary page
  stacking contexts.
- Treat the anchor width as the portal surface minimum by default, while
  allowing fixed-width custom surfaces to opt out when their content contract
  is intentionally narrower than a wide anchor.
- Place below the trigger when space permits, flip above near the viewport
  bottom, and clamp max height. On web, measure each portal surface at its
  natural height (up to `maxHeight`) before its first paint and require that
  whole height below, or the roomier side when it fits neither; `minHeight`
  can only raise that requirement. Measure once per open, so content that
  changes size while open keeps its side. Native, which does not measure,
  requires `minHeight` (default `140px`) below.
- Treat a selector trigger as the popup's minimum width, grow the popup to its
  wider option content, and cap that growth at `360px` by default and at the
  viewport edge in all cases. Per-selector minimum and maximum overrides may
  change the content bounds, but the configured maximum must not shrink a
  popup below a wider visible trigger unless the viewport itself is narrower.
- Support keyboard navigation, disabled row skipping, Enter selection, Escape
  close, hover active state, outside pointer close, loading/empty rows, section
  headers, dividers, footers, secondary text, right-side content, and danger or
  warning row tones.
- Keep the keyboard-active option scrolled into the visible list viewport when
  navigation moves through long dropdown or combobox lists.
- Include the field label in selector accessible names when a visual label is
  supplied, so repeated selectors remain distinguishable to assistive
  technology.
- Expose a selector's pressable trigger through an optional caller ref without
  giving up the internal anchor ref used for popup placement. Async modal forms
  own their hydration timing and must use that handle to focus the first real
  field after replacing a loading placeholder.
- Preserve no-match empty rows even when combobox footers are present.
- Keep input-backed comboboxes on a non-modal web portal so text inputs retain
  focus while results are open.
- Give field-style selectors and chip multi-selects the shared input border and
  focus glow, with autofocus support for controls mounted as active editors.
  Focusing a chip multi-select search input must open its option list, and
  pressing anywhere on the control must return focus to that input.
- Size chip multi-selects from the shared control scale and provide a
  fixed-height single-line mode for dense table or data-grid editors, so their
  chips cannot expand over neighboring rows; summarize overflow selections and
  keep checked option rows enabled as removal toggles.
- Provide an action-menu wrapper that owns the trigger anchor, controlled or
  uncontrolled open state, portal/list composition, and default close-after-row
  selection behavior for common trigger-backed menus.
- Offer selectable trigger gestures (press, hover, long-press, context menu) on
  the action-menu wrapper, resolving hover and context-menu behavior per
  platform and keeping press available where a gesture is unavailable.
- Keep dropdown and combobox portal layers opened inside the top dialog above
  its surface, subject to the [web overlay rules](web-overlays.md#background-content).
- Preserve native-safe fallbacks for Expo platform resolution.
- A menu drawn open in place has no portal and no measurement. It and the phone
  menu sheet follow the [menu rules](app-shell-parts.md#menus) of the app shell
  parts.

## Toast Contract

The toast family covers transient, non-blocking notifications driven from an
imperative API rather than rendered declaratively at a call site.

Required behavior:

- Provide a `ToastProvider` that owns a capped, ordered queue and publishes an
  imperative API (`toast`, `dismiss`, `dismissAll`) through a `useToast` hook
  and a module-level `toastController`; the hook must throw when used outside a
  provider, and the controller must throw before a provider is mounted.
- `toast()` must return an id usable with `dismiss`, default the tone to `info`,
  and default the auto-dismiss delay to the provider default while accepting a
  per-toast `duration` override and a `null`/non-positive duration for sticky
  toasts. Toasts must also accept a `variant` prop that defaults to `card`.
- Cap simultaneously visible toasts at a provider-configurable `max` (default 4)
  by dropping the oldest entries.
- Render toasts in a viewport pinned to one of six placements (top/bottom ×
  left/center/right), with the newest toast nearest the pinned edge, through a
  `document.body` portal with `position: fixed` on web and an
  absolutely-positioned, `pointerEvents="box-none"` overlay on native.
- Auto-dismiss each toast after its resolved duration and pause the countdown
  while the pointer or keyboard focus is over the toast.
- Carry tone (`info`, `success`, `warning`, `error`) as the leading icon color
  and screen-reader semantics: errors announce assertively with the `alert`
  role, other tones politely with the `status` role. The card keeps a uniform
  1px border on every edge — tone must never be drawn as a left accent strip
  (see the accent-bar rule in `AGENTS.md`).
- Support a compact `solid` variant that uses the tone color as the filled
  background, hides the default card icon, and can match the bottom-center
  transaction-error style through props.
- Support caller-provided leading icons for toast surfaces so in-progress,
  branded, or feature-specific visuals do not require new visual variants.
- Allow per-toast surface and filled-foreground overrides so compact solid
  toasts can match dark in-progress status surfaces through props.
- Allow per-toast title and description text style overrides that layer after
  the built-in variant text styles.
- Support an optional action button that runs its handler and then dismisses the
  toast, and an optional close control that dismisses only its own toast.
- Use shared theme tokens for the surface, border, accent colors, text, fonts,
  and radii, with no consumer-local theme imports.
- On web, float the toast viewport above modal surfaces, nested overlays, and
  the consent banner, and export the layer token for consumers.
- Keep the web toast region announced and operable under open dialogs, as
  required by the [live-overlay contract](web-overlays.md#live-overlays).
