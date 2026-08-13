# Button consumer capability gaps

Close the remaining reasons a consumer app still hand-rolls a `Pressable`
instead of using [`Button`](../src/button/Button.tsx): the press lifecycle,
per-state styling, a tone for imagery, a tap area independent of the visible
box, the label and slot hooks, and popup-trigger semantics.

**Status:** M1–M6 delivered. `Button` gains `onPressIn` / `onPressOut` /
`onLongPress` / `delayLongPress` and a forwarded gesture event; a functional
`style` plus a pressed treatment on every tone; the `onMedia` tone; `hitSlop`
and `boxSize`; `labelStyle`, `numberOfLines`, `trailing`, and `content`; and
`hasPopup`. Unit tests (`buttonCapabilities.test.ts` plus extensions to
`buttonSemantics.test.ts`), five new stories, and README coverage all landed.
`SegmentedControl` is untouched and stays open — see
[Out of scope](#out-of-scope).

---

## Background — where the list came from

The consumer that drove this is Juno's Expo app, which keeps every control it
cannot build on `@firna/ui` in one reviewed module, `ts/app/src/ui/selectable.tsx`,
and records each blocking gap in `docs/dev/firna-ui-capability-requests.md`
with the control that proved it. None of the items is speculative.

1.9.0 closed the largest of them — a caller `role` plus the state that role
must carry, which by itself unblocked nine app controls. This plan closes the
Button half of what was left. The gaps are independent of each other, so each
milestone is a shippable increment rather than a step toward one feature.

Two things shaped the API decisions rather than being copied from the requests:

1. **Where does press feedback belong?** The request was for a
   `({ pressed, hovered }) =>` style hook. But the underlying complaint is
   narrower: `style` layers _after_ the tone's washes, so a caller-supplied
   fill silently erases press feedback and has no way to add it back. That
   argues for both halves — a pressed treatment on the tones that lacked one
   (so the default needs no hook at all), and the hook for callers who have
   overridden the fill.
2. **Can a media tone be a theme token?** No. Every other tone composites
   against a theme surface and so must follow the active scheme. Imagery is
   dark in _every_ scheme, so a scheme-aware `onSolid` label would invert to
   dark text on dark media in the dark presets. The `onMedia` values are fixed
   on purpose, with an entry in the dark-mode guard's allowlist recording why.

## M1 — press lifecycle

- [x] Add `onPressIn`, `onPressOut`, `onLongPress`, and `delayLongPress`, and
      forward the `GestureResponderEvent` to `onPress`.
- [x] Type the forwarded event as optional: keyboard activation has no pointer,
      and Space routes through `buttonSpaceKeyProps.activate` with no event, so
      a caller reading the pointer position must handle its absence.
- [x] Gate the whole lifecycle on `busy` together, so a push-to-talk control
      cannot start on press-in and then never be released.

## M2 — per-state styling

- [x] Add a pressed treatment to the three tones that lacked one: `secondary`
      washes to `bg2` (mirroring `plain`), `danger` sharpens its edge to
      `roseDeep` (it cannot take a pressed fill without dropping its label
      below AA), and `primary` dims, because `primaryDeep` is already the
      darkest accent the theme contract defines.
- [x] Accept a functional `style`, handed the busy, disabled, focused, hovered,
      and pressed flags, and export `ButtonStateStyleArgs`.

## M3 — the `onMedia` tone

- [x] Add the tone: a translucent white veil that thickens on hover and press,
      borderless because a hairline edge is invisible on a busy image.
- [x] Resolve its label through `onMediaLabelColor()` so the fills and the
      label cannot drift apart.
- [x] Record the fixed-white rationale in the dark-mode guard's allowlist
      rather than weakening the guard.

## M4 — tap target and box size

- [x] Add `hitSlop`, so the tap area grows without the control growing with it.
- [x] Make it real on web. react-native-web's `Pressable` never reads
      `hitSlop` — only its legacy `Touchable` export does — so the prop would
      have been inert on the very platform that asked for it. `HitSlopExpander`
      draws the equivalent area as an inset, transparent child whose pointer
      events bubble to the button.
- [x] Add `boxSize` for a `square` / `circle` box set outright, including below
      the smallest density's 30px track.
- [x] Warn in development when `minTouchTarget` is below the size's own box,
      where it is silently inert, and point at `boxSize` / `hitSlop`.

## M5 — label, slots, and cards

- [x] Add `labelStyle` and `numberOfLines` on the library's own `<Text>`, which
      is the only place React Native honours the latter.
- [x] Add a `trailing` slot under the same decorative contract as the leading
      icon, and extract `DecorativeSlot` so that contract is stated once.
- [x] Add `content`, which replaces the icon + label row for a pressable card,
      and extend the no-visible-label union so it still requires a name.
- [x] Split the row into [`ButtonContent`](../src/button/ButtonContent.tsx) so
      `Button.tsx` stays about wiring props to the pressable.

## M6 — popup triggers, tests, stories, docs

- [x] Add `hasPopup` → `aria-haspopup`, web-only, with a dev warning on the
      roles ARIA does not support it on.
- [x] Unit tests: `buttonCapabilities.test.ts` for the component contract, and
      real behavioural assertions for `hasPopup` in `buttonSemantics.test.ts`.
- [x] Stories: `On media`, `Press lifecycle`, `Tap target`, `Label and slots`,
      and `Menu trigger`.
- [x] README: responsibilities, five new sections, the functional-`style`
      contract, and the accessibility and theming notes.
- [x] `npm run format`, `npm test`, `npm run typecheck`.

## Out of scope

`SegmentedControl` — request 8 in the consumer list — is untouched. It needs a
`style` prop, a track that is not hardcoded to `alignSelf: "flex-start"`,
per-option `testID`s, a re-pressable active option, and a nullable `value`.
That is a change to a different component with its own layout and keyboard
contract, so it belongs in its own plan rather than riding along here.
