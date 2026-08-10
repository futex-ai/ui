# Consumer Migration Handoff

## Accounting

Accounting currently owns the source dropdown, segmented control, radio card,
switch, button, modal, and avatar components copied into this package. The
migration should be a follow-up change in the accounting repo.

Recommended path:

1. Add `@firna/ui` to the accounting app dependency graph once this package is
   published or linked into the workspace.
2. Wrap the app or product shell in `SharedUiThemeProvider` with the default
   theme, or omit the provider if the default accounting-style theme is enough.
3. Replace imports from `@/components/dropdown/*` with `@firna/ui/dropdown`.
4. Replace imports from `@/components/modal/*` with `@firna/ui/modal`.
5. Replace imports from `@/components/SegmentedControl` with
   `@firna/ui/segmented`; Profit & loss source filters can use
   `sizing="content"` with `wrap`.
6. Replace imports from `@/components/RadioCard` with `@firna/ui/radio`.
7. Replace imports from `@/components/Switch` with `@firna/ui/switch`.
8. Replace the `Button` (and `UiButton` alias) exported from `@/components/ui`
   with `@firna/ui/button`; the tone, block, and icon props match, and `size`
   is extended with a new `lg` (46px) variant beyond the accounting button's
   `sm` / `md`. The shared button additionally treats a missing `onPress` as
   disabled, so audit any decorative `Button` without a handler.
9. Replace the `Avatar` export from `@/components/ui` with `@firna/ui/avatar`
   (the `tone="sage"` default becomes `tone="solid"`).
10. Remove the duplicated accounting component files only after all imports,
    tests, and smoke coverage pass.
11. Run accounting app tests, typecheck, web smoke tests, `cargo xtask check`,
    commit, push, and run `cargo xtask review`.

Expected compatibility:

- Accounting's current sage primary color is the package default.
- Existing dropdown, segmented control, radio card, switch, button, modal, and
  avatar behavior is preserved by copied unit and browser tests in this repo.

## Juno

Juno should consume the same components with Juno's purple primary color family.

Recommended path:

1. Add `@firna/ui` to the Juno app dependency graph once this package is
   published or linked into the workspace.
2. Wrap the relevant app shell with:

   ```tsx
   import { SharedUiThemeProvider, junoSharedUiTheme } from "@firna/ui";

   <SharedUiThemeProvider theme={junoSharedUiTheme}>
     <App />
   </SharedUiThemeProvider>;
   ```

3. Import dropdowns from `@firna/ui/dropdown`, radio cards from
   `@firna/ui/radio`, segmented controls from `@firna/ui/segmented`, switches
   from `@firna/ui/switch`, buttons from `@firna/ui/button`, avatars from
   `@firna/ui/avatar`, and web modals from `@firna/ui/modal`.
4. Keep native iOS/Android sheets, action sheets, and OS pickers in Juno app
   code; this package's `WebModalFrame` remains web-only.
5. Replace app-owned pressables that only existed because `Button` hardcoded its
   role — nav rail rows, tabs, checkbox rows, toggle buttons, colour swatches —
   with `@firna/ui/button` plus `role` and the matching state prop (`selected`
   for a tab, `checked` for a checkbox / radio / switch, `pressed` for a toggle).
   They then inherit the shared focus glow instead of falling through to the
   browser's blue outline. The `tablist` / `radiogroup` / `menu` container and
   any arrow-key navigation stay in app code.
6. Wire a focus glow onto any control that must stay hand-rolled with
   `useFocusRing` from `@firna/ui/focusRing` — spread `webOutlineReset`, apply
   `focusRingStyle` while `focused`, and pass the hook's `onFocus` / `onBlur` to
   the pressable. Do not drop `outlineStyle: "none"` on its own: that removes the
   only keyboard-focus indicator and regresses WCAG 2.1 — 2.4.7.
7. Run Juno app tests, typecheck, browser smoke tests, `cargo xtask check`,
   commit, push, and run `cargo xtask review`.

## Follow-Up Gaps

- Use the published `@firna/ui` package for normal migrations, or the tarball
  from `npm pack` for pre-release app smoke tests.
- Add consumer-specific visual smoke coverage after each app migrates imports.
- Confirm whether either app needs more theme tokens beyond the primary color
  family and existing semantic tokens.
- Consider replacing storybook-only SVG shims if the apps standardize on a
  browser-native icon package for web previews.
