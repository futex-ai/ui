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
  optional `minTouchTarget` floor independent of the label height scale.
- Render a compact, line-height-neutral `inline` chip that flows inside a line of
  text (an inline "Restore" / "Undo" action) without growing the row's height.
- Stretch full width with `block`.
- Own the sage focus ring on the whole control and hide the browser's default
  outline, using shared theme colours and radii.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing `onPress` as a read-only disabled control (matching the library's
  other pressables).
- Re-point that role with `role` — `checkbox`, `menuitem`, `radio`, `switch`, or
  `tab` — paired with the state that role must carry (`checked` / `selected` /
  `pressed` / `expanded`), and bind Spacebar for the roles react-native-web
  leaves unbound.
- Support an in-progress `busy` state that stays focusable and announces
  `aria-busy`, blocks the press handler, and swaps the leading icon for a
  spinner.

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

## Styling

`style` extends the pressable container (`ViewStyle`). Tone, size, the focus
ring, and the disabled treatment are applied by the component; `style` layers on
top for one-off layout tweaks (e.g. margins).

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
- **Focus visible (2.4.7, AA).** The library's shared soft focus glow (the same
  `useFocusRing` box-shadow ring input / switch / radio / segmented use) is shown
  on focus for every tone — including `primary`, where a border-colour ring would
  be invisible — and the browser's default outline is suppressed.
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
`colors.primary`, and the corner radius uses `radii.md`.
