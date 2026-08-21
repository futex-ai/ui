# Button

Shared pressable button for React Native and React Native Web, adapted from the
accounting app's `.btn` primitive. It is the single button primitive for the
library: tones, sizes, an optional leading icon (lucide or a caller-supplied
node), icon-only shapes, and a full-width block variant, all driven by shared
theme tokens.

## Responsibilities

- Render a labelled button with one of five tones: `primary` (filled),
  `secondary` (the default surface + border), `ghost` (no fill/border, brand
  label), `plain` (no fill/border, neutral `ink` label — a flush icon button),
  and `danger` (rose border + label).
- Size the control with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling height, padding, the label type scale, and the icon.
- Show an optional leading `icon` (a lucide glyph, tinted to the label colour) or
  a caller-supplied `iconNode` (any node — e.g. an `@expo/vector-icons` glyph —
  rendered as-is, never wrapped in `<Text>`).
- Keep caller-supplied icon nodes decorative and non-interactive so a focusable
  child SVG cannot take pointer focus away from the outer button.
- Render as an icon-only `square` or `circle` (`shape`) 1:1 tap target, with an
  optional `minTouchTarget` floor independent of the label height scale, a
  `boxSize` that sets that box outright (including below the smallest density),
  and a `hitSlop` that grows the tap area without growing the control.
- Render a compact, line-height-neutral `inline` chip that flows inside a line of
  text (an inline "Restore" / "Undo" action) without growing the row's height.
- Stretch full width with `block`.
- Carry the whole press lifecycle — `onPressIn`, `onPressOut`, `onLongPress`,
  `delayLongPress`, and a forwarded gesture event — so push-to-talk and
  open-at-the-pointer controls do not need a hand-rolled pressable.
- Give every tone a pressed treatment, and accept a functional `style` so a
  caller whose own fill has erased those washes can put press feedback back.
- Sit on photography or video with the `onMedia` tone, whose translucent white
  veil and label stay white in every scheme.
- Open the label and the row to the caller: `labelStyle`, `numberOfLines`, a
  `trailing` slot, and a `content` escape hatch for a pressable card.
- Own the sage focus ring on the whole control and hide the browser's default
  outline, using shared theme colours and radii. On web the ring follows
  `:focus-visible`, and disabling a focused button clears its tracked focus so a
  stale ring cannot return when the button is re-enabled.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing `onPress` as a read-only disabled control (matching the library's
  other pressables).
- Re-point that role with `role` — `checkbox`, `menuitem`, `radio`, `switch`, or
  `tab` — paired with the state that role must carry (`checked` / `selected` /
  `pressed` / `expanded`), and bind Spacebar for the roles react-native-web
  leaves unbound.
- Support an in-progress `busy` state that stays focusable and announces
  `aria-busy`, blocks the whole press lifecycle, and swaps the leading icon for
  a spinner.
- Announce the overlay a trigger opens with `hasPopup` (`aria-haspopup`).

## Usage

```tsx
import { Button } from "@firna/ui/button";
import { Plus, Settings } from "lucide-react-native";

<Button icon={Plus} onPress={addAccount} tone="primary">
  Add account
</Button>

<Button onPress={cancel}>Cancel</Button>

<Button block onPress={save} size="lg" tone="primary">
  Save changes
</Button>

<Button onPress={remove} size="sm" tone="danger">
  Delete
</Button>

{/* Icon-only: no visible text, so `accessibilityLabel` is required. */}
<Button accessibilityLabel="Settings" icon={Settings} onPress={openSettings} />

{/* Flush circular header icon button: borderless `plain` tone, 1:1 `circle`
    shape, a non-lucide glyph, and a 40px minimum tap target. */}
<Button
  accessibilityLabel="More"
  iconNode={<Ionicons name="ellipsis-horizontal" size={20} color="#1c1f1d" />}
  minTouchTarget={40}
  onPress={openMenu}
  shape="circle"
  tone="plain"
/>

{/* In-progress: blocks the press, shows a spinner, announces `aria-busy`. */}
<Button busy={saving} onPress={save} tone="primary">
  {saving ? "Saving" : "Save"}
</Button>

{/* Inline chip beside a label — collapses to the row's line height. The row's
    `paddingVertical` gives the overflowing pill + focus ring room (needed under
    `overflow: "hidden"` on web and on native Android). */}
<View style={{ alignItems: "center", flexDirection: "row", gap: 8, paddingVertical: 8 }}>
  <Text>Moved to Trash</Text>
  <Button inline onPress={restore}>Restore</Button>
</View>
```

### Tones

`tone` sets the emphasis: `primary` for the main action, `secondary` (default)
for neutral actions, `ghost` for low-emphasis inline actions (brand-accent
label), `plain` for a flush, chrome-less icon button (neutral `ink` label with a
neutral hover/pressed wash), and `danger` for destructive ones. The label and
any leading lucide `icon` share one colour per tone; an `iconNode` keeps its own
colour.

### Icon-only shapes

`shape` sets the container geometry: `rounded` (default) is the padded rectangle;
`square` is an equal-padding 1:1 box; `circle` is that box with a full radius.
The 1:1 shapes are for icon-only buttons. `minTouchTarget` floors the tap target
(min width and height) at a given px — independent of `size` — so a compact icon
button still meets a comfortable ≥40–44px touch target; on `square` / `circle`
it also grows the box to that dimension.

### Icons

Pass a lucide component to `icon` (tinted to the label colour and sized to the
control), or any node to `iconNode` for a non-lucide glyph — the node renders
as-is (never inside `<Text>`), so the caller owns its colour and size. `iconNode`
wins when both are set. Either way the glyph is hidden from assistive technology
on web; the label (or the required `accessibilityLabel`) is the accessible name.
The `iconNode` wrapper also ignores pointer events, ensuring clicks target and
focus the button even if the supplied node contains an SVG with a `tabIndex`.
Interactive content is therefore not supported inside `iconNode`; render it as
a separate named control instead.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the accounting button (38px tall). Buttons and inputs share this
scale, so a form can size a field and its submit button consistently. `sm`
(30px) suits dense, non-touch-first contexts such as table rows and toolbars;
prefer `md` or `lg` for primary, touch-first actions.

### Inline

`inline` renders a compact chip that flows inside a line of text — an inline
"Restore" / "Undo" action beside a label — without changing the row's line
height. It drops the fixed track height and hugs the label with a tight padding,
then pulls that padding (and the 1px border) back off with a negative vertical
margin, so the button's outer (margin-box) height collapses to exactly its label
line height. Dropped into a row it takes the same vertical space as a run of text
at its `size`, so the row's height tracks the text beside it, not the button; the
pill's fill/border overflow the text line above and below without affecting
layout.

It composes with `tone` (`secondary` (default) is a bordered chip; `ghost` and
`plain` are borderless), `size`, and a leading `icon`. It is a small,
non-touch-first target — it relies on WCAG 2.5.8's inline / line-height
target-size exception rather than the 24px minimum — so reach for it in
pointer/text contexts, not for primary touch actions. It is a text-flow chip: the
icon-only `square` / `circle` shapes and an explicit `minTouchTarget` are
fixed-size intents that contradict the collapse, so `inline` is ignored (a no-op)
when either is set, and it should not be paired with `block`.

Because the chip **and its focus ring** overflow the text line, give the row a
little vertical padding — slightly more than the pill, for the ring. On web that
only matters under an `overflow: "hidden"` ancestor; on native (notably Android)
a parent can clip children to its own bounds, so the padding keeps the pill from
being sheared. The example rows in the story set `paddingVertical` for this.

### Block

`block` stretches the button to fill its container (full width), for stacked
form actions and bottom sheets.

### Roles and states

`role` re-points the button at another single-activation role, so a rail row,
tab, checkbox, radio, switch, or menu item is a themed `Button` rather than a
hand-rolled `Pressable` that has to re-derive the tones, sizes, focus glow, and
disabled/busy handling. Each role carries exactly one state prop:

| `role`     | state prop | announced as    |
| ---------- | ---------- | --------------- |
| `button`   | `pressed`  | `aria-pressed`  |
| `checkbox` | `checked`  | `aria-checked`  |
| `radio`    | `checked`  | `aria-checked`  |
| `switch`   | `checked`  | `aria-checked`  |
| `tab`      | `selected` | `aria-selected` |
| `menuitem` | —          |                 |

`expanded` is separate and composes with `button`, `checkbox`, `menuitem`, and
`tab` for a control that reveals a menu, panel, or section.

```tsx
{
  /* A settings rail. The `tablist` is the caller's — see the note below. */
}
<View accessibilityLabel="Settings sections" accessibilityRole="tablist">
  {sections.map((item) => (
    <Button
      key={item.id}
      onPress={() => setSection(item.id)}
      role="tab"
      selected={section === item.id}
      tone={section === item.id ? "primary" : "plain"}
    >
      {item.label}
    </Button>
  ))}
</View>;

{
  /* A toggle button. */
}
<Button onPress={() => setPinned(!pinned)} pressed={pinned}>
  {pinned ? "Pinned" : "Pin"}
</Button>;

{
  /* A checkbox. */
}
<Button checked={notify} onPress={() => setNotify(!notify)} role="checkbox">
  Email notifications
</Button>;
```

Pairing a state with a role ARIA does not allow — or leaving a `checkbox` /
`radio` / `switch` without `checked`, or a `tab` without `selected` — fires a
`__DEV__` warning naming the mismatch, because the resulting control announces
the wrong thing rather than failing loudly.

`link` is deliberately not a member: a re-roled button has no `href`, so it
cannot be opened in a new tab, middle-clicked, or copied as a URL. Use an anchor
for a real link.

**`Button` is a single control, not a group.** It does not own roving focus or
arrow-key navigation, so the `tablist` / `radiogroup` / `menu` container and any
group keyboard model belong to the caller. `SegmentedControl` already implements
the radiogroup pattern end to end if that is what you need.

### Imperative focus

`buttonRef` exposes the underlying pressable for callers that must drive focus
themselves. The usual reason is a modal's `initialFocusRef`: `WebModalFrame`
opens focus on the first control the caller rendered, so a destructive
confirmation should point it at the safe action instead.

```tsx
const cancelRef = useRef<View | null>(null);

<WebModalFrame initialFocusRef={cancelRef} /* … */>
  <Button buttonRef={cancelRef} onPress={onClose}>
    Cancel
  </Button>
</WebModalFrame>;
```

The prop is named rather than a forwarded `ref`, matching `InputFrame`'s
`inputRef`.

### Press lifecycle

`onPress` is joined by `onPressIn`, `onPressOut`, `onLongPress`, and
`delayLongPress`, so a control whose meaning is the _hold_ — push-to-talk, a
press-and-hold confirm — is a `Button` rather than a hand-rolled `Pressable`.
`busy` gates the whole lifecycle together, so a control can never start on
press-in and then never be released.

```tsx
<Button
  delayLongPress={400}
  icon={Mic}
  onPress={sendTapMessage}
  onPressIn={startRecording}
  onPressOut={stopRecording}
  tone="primary"
>
  Hold to talk
</Button>
```

The gesture event is forwarded to `onPress`, so a menu trigger can open at the
pointer instead of wrapping the button in a `<View>` and measuring it. It is
**optional** — a keyboard activation has no pointer, and both Enter and Space
call the handler with no event — so anchor to the control itself when it is
absent:

```tsx
<Button onPress={(event) => openMenu(event ? pointOf(event) : anchorRef)}>
  Actions
</Button>
```

### On media

Every other tone composites against a theme surface, so all of them disappear on
a photograph. `onMedia` is a translucent white veil that thickens on hover and
press, with a fixed white label:

```tsx
<Button
  accessibilityLabel="Close preview"
  icon={X}
  onPress={close}
  shape="circle"
  tone="onMedia"
/>
```

Its fills and label are deliberately **not** theme tokens. Imagery is dark
whichever scheme is mounted, so a scheme-aware `onSolid` would invert to dark
text on dark media in the dark presets.

### Tap target and box size

`minTouchTarget` is a floor: it can only grow the visible box, and one below the
size's own track is inert (a `__DEV__` warning says so). Two other props cover
what it cannot:

- `boxSize` sets a `square` / `circle` button's visible dimension outright,
  including below the smallest density's 30px track, for a glyph a design specs
  smaller than any control size.
- `hitSlop` extends the pressable area beyond the visible box, so a compact
  control still meets a comfortable target (WCAG 2.1 — 2.5.5 AAA / 2.5.8 AA)
  without growing. React Native reads it off the pressable; on web —
  where react-native-web's `Pressable` ignores the prop entirely — the same
  area is drawn as an inset, transparent child whose events bubble to the
  button. Either way the expanded area overlaps whatever sits beside the
  control, so reach for it on a control with room around it.

```tsx
<Button
  accessibilityLabel="Remove tag"
  boxSize={16}
  hitSlop={14}
  icon={X}
  onPress={remove}
  shape="circle"
  tone="plain"
/>
```

### Label, slots, and cards

`labelStyle` merges over the label after the tone's colour, and `numberOfLines`
truncates it — which has to be set here, because React Native ignores
`numberOfLines` on a nested `<Text>`. `trailing` renders after the label under
the same decorative contract as the leading icon, so a selector can pin a
chevron to its far edge:

```tsx
<Button
  block
  labelStyle={{ flex: 1, textAlign: "left" }}
  numberOfLines={1}
  onPress={openSwitcher}
  trailing={<ChevronDown color={theme.colors.ink} size={16} />}
>
  {workspaceName}
</Button>
```

`content` replaces the icon + label row entirely, for a pressable card that
performs an action. The button keeps its role, focus ring, press handling, and
disabled treatment and stops imposing a label layout; pair it with `style` to
drop the row direction and the fixed track height. There is no visible text for
the library to read a name from, so `accessibilityLabel` is required.

### Menu triggers

`hasPopup` announces what a trigger opens (`aria-haspopup`) before the user
commits to opening it; pair it with `expanded` when the surface opens in place:

```tsx
<Button expanded={open} hasPopup="menu" icon={MoreHorizontal} onPress={toggle}>
  Actions
</Button>
```

It is web-only — the mobile accessibility APIs model no "has popup" relationship
— and ARIA supports it on the `button`, `menuitem`, and `tab` roles only; a
`checkbox` / `radio` / `switch` is a value control rather than a trigger, and a
`__DEV__` warning says so.

## Styling

`style` extends the pressable container (`ViewStyle`). Tone, size, the focus
ring, and the disabled treatment are applied by the component; `style` layers on
top for one-off layout tweaks (e.g. margins).

Because it layers last, a caller-supplied fill also overrides the tone's own
hover and pressed washes — which is why `style` accepts a function of the
interaction state, so that caller can put press feedback back:

```tsx
<Button
  onPress={archive}
  style={({ pressed }) => [
    { backgroundColor: theme.colors.amberSoft },
    pressed ? { opacity: 0.82 } : null,
  ]}
>
  Archive
</Button>
```

The state is `{ busy, disabled, focused, hovered, pressed }`; `hovered` is
web-only and stays `false` on native.

## Accessibility

- **Accessible name (WCAG 1.1.1 / 4.1.2, A).** A button with visible text uses
  that text as its name; pass `accessibilityLabel` only to override it (keep the
  visible text a substring so it still satisfies 2.5.3 Label in Name). An
  **icon-only** button (no children) **requires** `accessibilityLabel` — this is
  type-enforced, and a `__DEV__` warning fires if a name can't be resolved.
- **Decorative icon (1.1.1, A).** The leading icon is hidden from assistive
  technology (`aria-hidden` on web), so the button is announced once by its name
  rather than by the raw glyph. Caller-supplied icon nodes also ignore pointer
  events, preventing a focusable descendant from stealing click focus and
  showing a second browser focus outline inside the button.
- **Busy state (4.1.2, A).** `busy` sets `aria-busy`, blocks the press handler,
  and swaps the icon for a spinner while keeping the button focusable and
  announced. It is distinct from `disabled` (which removes the control from the
  tab order). The spinner stops animating under `prefers-reduced-motion`.
- **Keyboard (2.1.1, A).** On the default `button` role, Enter/Space activation
  is delegated to React Native Web's `role="button"` synthesis (no explicit
  `onKeyDown` is wired); a Playwright test asserts both keys still activate to
  catch RNW regressions. React Native Web presses Enter on _every_ role but
  binds Spacebar to `button` roles alone, so the other `role` values wire Space
  themselves — swallowing it (rather than scrolling the page) even while
  disabled or busy, and leaving Enter to the press responder so a press never
  fires twice.
- **Role and state (4.1.2, A).** The role state travels on two channels because
  the renderers disagree: React Native reads `accessibilityState`, while React
  Native Web honours it only on `TouchableWithoutFeedback` and so needs the
  literal `aria-*` props. `Button` emits both. `pressed` is the exception — React
  Native models no pressed toggle and `aria-pressed` is the only toggle state
  ARIA allows on `role="button"`, so on web it stays `aria-pressed` and on native
  it degrades to the announced `selected` state.
- **Popup triggers (4.1.2, A).** `hasPopup` emits `aria-haspopup` on web so a
  screen reader can say which kind of surface Enter will open; `expanded`
  reports whether it is open. ARIA supports the attribute on `button`,
  `menuitem`, and `tab` only, and a `__DEV__` warning fires on the rest.
- **Target size (2.5.5 AAA / 2.5.8 AA).** `hitSlop` grows the pressable area
  without growing the control, so shrinking a glyph with `boxSize` never
  shrinks its tap target with it.
- **Focus visible (2.4.7, AA).** The library's shared soft focus glow (the same
  `useFocusRing` box-shadow ring input / switch / radio / segmented use) is shown
  for `:focus-visible` focus on web and all platform focus on native. It covers
  every tone — including `primary`, where a border-colour ring would be invisible
  — and suppresses the browser's default outline. The hook listens for native web
  blur as well as React `onBlur`, so disabling and later re-enabling a focused
  button cannot restore a stale glow.
- **Resting border.** The secondary button's resting edge uses the
  `controlBorder` token — a soft, translucent-ink line (intentionally below the
  1.4.11 ≥3:1 non-text-contrast floor, for a calmer edge). The `ghost` tone
  intentionally has no resting border or fill: its `primaryDeep` label is the
  affordance.

## Theming

Buttons read colours and radii from `SharedUiThemeProvider`: the primary tone
uses `colors.primary`, the ghost label uses `colors.primaryDeep`, the danger
border/label uses `colors.roseSoft` / `colors.rose`, the secondary fill uses
`colors.surface` with the `colors.controlBorder` boundary, the focus ring uses
`colors.primary`, and the corner radius uses `radii.md`. The pressed treatments
use `colors.bg2` (secondary) and `colors.roseDeep` (danger); `primary` dims
instead, because `primaryDeep` is already the darkest accent the theme contract
defines. The `onMedia` tone is the one exception to all of this — see
[On media](#on-media).
