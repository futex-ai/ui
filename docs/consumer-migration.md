# Consumer Migration Handoff

## Accounting

Accounting currently owns the source dropdown, segmented control, and modal
components copied into this package. The migration should be a follow-up change
in the accounting repo.

Recommended path:

1. Add `@futex/ui` to the accounting app dependency graph once this package is
   published or linked into the workspace.
2. Wrap the app or product shell in `SharedUiThemeProvider` with the default
   theme, or omit the provider if the default accounting-style theme is enough.
3. Replace imports from `@/components/dropdown/*` with `@futex/ui/dropdown`.
4. Replace imports from `@/components/modal/*` with `@futex/ui/modal`.
5. Replace imports from `@/components/SegmentedControl` with
   `@futex/ui/segmented`; Profit & loss source filters can use
   `sizing="content"` with `wrap`.
6. Remove the duplicated accounting component files only after all imports,
   tests, and smoke coverage pass.
7. Run accounting app tests, typecheck, web smoke tests, `cargo xtask check`,
   commit, push, and run `cargo xtask review`.

Expected compatibility:

- Accounting's current sage primary color is the package default.
- Existing dropdown, segmented control, and modal behavior is preserved by
  copied unit and browser tests in this repo.

## Juno

Juno should consume the same components with Juno's purple primary color family.

Recommended path:

1. Add `@futex/ui` to the Juno app dependency graph once this package is
   published or linked into the workspace.
2. Wrap the relevant app shell with:

   ```tsx
   import { SharedUiThemeProvider, junoSharedUiTheme } from "@futex/ui";

   <SharedUiThemeProvider theme={junoSharedUiTheme}>
     <App />
   </SharedUiThemeProvider>;
   ```

3. Import dropdowns from `@futex/ui/dropdown`, segmented controls from
   `@futex/ui/segmented`, and web modals from `@futex/ui/modal`.
4. Keep native iOS/Android sheets, action sheets, and OS pickers in Juno app
   code; this package's `WebModalFrame` remains web-only.
5. Run Juno app tests, typecheck, browser smoke tests, `cargo xtask check`,
   commit, push, and run `cargo xtask review`.

## Follow-Up Gaps

- Decide how this package will be published or linked into the accounting and
  Juno workspaces.
- Add consumer-specific visual smoke coverage after each app migrates imports.
- Confirm whether either app needs more theme tokens beyond the primary color
  family and existing semantic tokens.
- Consider replacing storybook-only SVG shims if the apps standardize on a
  browser-native icon package for web previews.
