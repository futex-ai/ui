# Accessibility manual test checklist

The automated gate (`tests/browser/a11y.spec.ts` axe sweep + the interaction
tests in `tests/browser/storybook.spec.ts`) catches static and scripted
regressions, but some WCAG 2.1 AA criteria can only be confirmed by hand. Run
this checklist before a release and whenever a component's interaction model
changes.

> Scope: `@firna/ui` ships to **React Native Web**, so WCAG governs the web DOM.
> These checks target a browser; native screen-reader behaviour benefits from the
> same `accessibility*` props but is validated separately by the consuming app.

## Per release

### Keyboard only (unplug / ignore the mouse)

- [ ] Every interactive control is reachable with `Tab` and operable with
      `Enter`/`Space` (2.1.1 Keyboard, A).
- [ ] Composite widgets (radio group, segmented control, calendar grid, heatmap,
      menus) are a **single** Tab stop and move an inner focus with
      arrows / `Home` / `End` (2.1.1 A; 4.1.2 Name/Role/Value, A).
- [ ] A **visible focus indicator** appears on every focused control, including
      borderless ones (switch track, segmented pill) (2.4.7 Focus Visible, AA).
- [ ] Overlays (modal, popover, dropdown, calendar) move focus into the surface
      on open, trap it sensibly, and restore it to the trigger on close; `Escape`
      dismisses the top-most layer only (2.4.3 Focus Order, A; 2.1.2 No Keyboard
      Trap, A).
- [ ] No control changes context merely on focus (3.2.1 On Focus, A).

### Screen readers

Test VoiceOver (Safari **and** Chrome on macOS) and NVDA (Firefox **and** Chrome
on Windows).

- [ ] Each control announces a correct **role + name + state** — checked,
      selected, expanded, disabled, busy, current value (4.1.2 A).
- [ ] Icon-only buttons and avatars announce a meaningful name; decorative icons
      are silent (1.1.1 Non-text Content, A).
- [ ] Inputs announce their label and, when invalid, their error text (3.3.1
      Error Identification, A; 3.3.2 Labels or Instructions, A).
- [ ] Status updates not given focus are announced: toasts, validation results,
      filtered result counts, calendar month changes, selection counts (4.1.3
      Status Messages, AA).

### Vision / display

- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for large text); state indicators and focus
      rings ≥ 3:1 — in **both** the default and Juno themes (1.4.3 Contrast, AA;
      1.4.11 Non-text Contrast, AA). Exception: the resting `controlBorder` edge
      is an intentional sub-3:1 soft, translucent-ink line (it blends rather than
      outlines); the active/invalid borders and focus rings still clear 3:1.
- [ ] State is never conveyed by color alone — there is a shape/text/position cue
      too (1.4.1 Use of Color, A).
- [ ] At 200% browser zoom and 320 px width nothing is clipped or overlaps; the
      layout reflows (1.4.4 Resize Text, AA; 1.4.10 Reflow, AA).
- [ ] With a text-spacing bookmarklet applied, no text is clipped (1.4.12 Text
      Spacing, AA).
- [ ] Windows High Contrast / forced-colors mode: focus indicators and control
      boundaries remain visible.
- [ ] With `prefers-reduced-motion: reduce`, non-essential animation is removed
      or shortened (2.3.3 Animation from Interactions — best practice / AAA).
- [ ] Loading indicators still animate under `prefers-reduced-motion: reduce` —
      the `Spinner` and every `Loader` variant slow down and fade rather than
      moving, because a frozen indicator reads as a hung screen. Removing the
      animation entirely is the wrong fix here.

### Pointer / touch

- [ ] Any drag/path gesture has a single-pointer or keyboard alternative (2.5.1
      Pointer Gestures, A).
- [ ] Actions fire on pointer-up and can be aborted by moving away before release
      (2.5.2 Pointer Cancellation, A).

## When adding or changing a component

- [ ] Add/extend a story so the axe sweep covers the new states.
- [ ] Add interaction-test coverage for the keyboard model in
      `storybook.spec.ts`.
- [ ] If a new axe finding is intentional and unavoidable on RNW, record it in
      `axe-baseline.json` with a comment in the PR explaining why.
