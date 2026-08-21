# @firna/ui — WCAG 2.1 AA Remediation Plan

## 1. Executive Summary

### Current posture

`@firna/ui` is in materially better accessibility shape than a typical RN/RNW component library. The team already applies React Native `accessibility*` props **widely and deliberately**, and several subsystems are genuinely best-in-class:

- **Roles & states are present on most controls.** Button, Switch, RadioCard, SegmentedControl all set `accessibilityRole` + `accessibilityState` and, where RNW does not auto-synthesize Enter/Space for non-`button` roles, add explicit `onKeyDown` (`Switch.tsx:44-53`, `RadioCard.tsx:49-58`).
- **Modal is a real dialog**: focus trap, focus save/restore, and a shared Escape-layer stack (`WebModalFrame.web.tsx:114-168`, `escapeLayer.ts`).
- **Toast is a model status-message implementation**: tone-appropriate `role=status/alert` + `aria-live`, never steals focus, and a true pause/resume timer on hover _and_ keyboard focus (`Toast.tsx:60-92`, `toastModel.ts:143-153`).
- **Dropdown plumbing** (Escape layering, outside-click dismissal, `aria-expanded`/`aria-haspopup` on triggers, non-blocking portal) is solid; the selector's keyboard nav correctly uses a document-level capture listener to dodge the RNW-TextInput `onKeyDown` swallow (`useDropdownSelectorNavigation.ts:118-130`).
- **Test scaffolding is strong**: every component has stories, a ~1641-line Playwright harness already asserts roles/aria/keyboard/focus, and Storybook renders the real RNW DOM (`react-native` aliased to `react-native-web`).

### Systemic gaps

Four cross-cutting failure patterns repeat across nearly every component:

1. **Non-text contrast (1.4.11, AA) of the shared design tokens.** `border`/`border2` are ~1.1–1.45:1 against surface, so the resting boundary of _almost every form control_ (input, date trigger, dropdown selector, secondary button, segmented cell, radio card, switch off-track) is imperceptible. Several text tokens (`faint`, `muted` on tints, Juno `amber`, `rose`-on-`roseSoft`) fall below 1.4.3 (AA) minimums.
2. **Focus visibility (2.4.7, AA) is border-dependent.** `useFocusRing` only recolors an existing border (`focusRing.ts:18-21`), so borderless controls (Switch track, segmented pill) show **no** focus ring; Switch wires no focus handling at all (verified `Switch.tsx:55-65`).
3. **Composite-widget keyboard model is missing.** Radio group, segmented control, calendar grid, and heatmap grid announce `radiogroup`/`radio`/`button` roles but have **no roving tabindex and no arrow-key navigation** — keyboard behavior contradicts the advertised role (2.1.1 A, 4.1.2 A).
4. **Dynamic content is not announced (4.1.3, AA) and overlay focus is unmanaged (2.4.3 A).** Combobox filter results, calendar month changes, and validation errors update silently; the popover surface and web calendar popover have no role, no name, and no focus management.

There is also **zero automated a11y tooling** today (no axe, no Storybook a11y addon, no ESLint), despite ideal infrastructure to add it.

### Conformance target

**WCAG 2.1 Level AA** for the **web (RNW) DOM output** of every shipped component, enforced by an automated gate in the existing `verify` chain and validated by a documented manual screen-reader pass. AAA / best-practice items (reduced-motion **2.3.3 AAA**, AAA target size **2.5.5**) are tracked but scoped as Phase 3 polish and never counted toward AA done.

> **Level legend used throughout:** (A) and (AA) items are **required for AA conformance**. (AAA/bp) items are **best-practice / out of AA scope** — listed for completeness, never gating.

---

## 2. Scope Note

- `@firna/ui` is **React Native + React Native Web**. WCAG governs the **web DOM** that RNW emits, so all conformance claims and the automated gate target the browser output. RNW maps: `accessibilityRole → role`, `accessibilityLabel → aria-label`, `accessibilityState.{checked,disabled,selected,busy,expanded} → aria-*`, `accessibilityLiveRegion → aria-live`, `nativeID → id`, and forwards literal `aria-*` props.
- **Known RNW mapping caveats (verify in the built 0.21 bundle, not from docs):**
  - `accessibilityHint` is **not** mapped to `aria-describedby` on web — error/hint association must use `nativeID` + literal `aria-describedby`/`aria-errormessage`.
  - RNW `TextInput` **replaces a forwarded `onKeyDown`** with its internal handler; web key handling for inputs must go through a `document`-level capture listener (as `useDropdownSelectorNavigation.ts:118-130` already does, and as `useComboboxNavigation` fails to do).
  - RNW synthesizes Enter/Space activation for `role=button` Pressables but **not** for `role=switch`/`role=radio` — those need explicit `onKeyDown` (already present in Switch/RadioCard).
  - `accessibilityState.selected` on a `role=button` is **not** reliably emitted as `aria-selected` (documented at `storybook.spec.ts:843`); use the correct row role (`option`) so `aria-selected` is valid.
  - `inert` / forced `aria-hidden` on background nodes are **not** emitted by RNW — set them imperatively via a DOM ref/effect in a `.web.tsx` path.
  - `accessibilityRole="grid"/"row"/"gridcell"/"columnheader"` and `aria-activedescendant` are web concepts — gate them with `Platform.OS === "web"` or a `.web.tsx` file so native semantics are not regressed.
- **Contrast numbers in the audit are computed estimates** from literal hex tokens and must be **re-verified with a calibrated tool / the axe `color-contrast` rule** before tokens are finalized.
- Honor the repo MEMORY RNW pitfalls (no `dataSet` typing, `CircleX`/lucide import issues, native a11y "labelled container merges descendants"). Use standard props and imperative DOM refs where RNW will not forward an attribute.

---

## 3. Foundations First (cross-cutting workstream)

These unblock or de-duplicate the per-component work and must land early (Phase 0/1). Most per-component findings collapse into one of these.

> **Implementation status (Phase 0 — DONE ✅)**
>
> - [x] **F1** — added `controlBorder` (≥3:1) and `placeholder` (≥4.5:1) tokens + darkened `muted` in both default & Juno themes (`src/theme.tsx`). Per-component token adoption happens in the component waves.
> - [x] **F2** — `useFocusRing`/`focusRingStyleFor` now emit a geometry-bearing `outline` ring visible on borderless controls (`src/focusRing.ts`).
> - [x] **F3** — `nextNavIndex` / `rovingTabIndex` / `focusItemAt` / `useDocumentKeyCapture` (`src/keyboardNavigation.ts`, unit-tested in `tests/unit/keyboardNavigation.test.ts`).
> - [x] **F4** — `announce()` / `useAnnouncer()` polite+assertive live-region helper, web + native (`src/announcer.ts`).
> - [x] **F5** — `useReducedMotion()` (`src/useReducedMotion.ts`).
> - [x] **F6** — `@axe-core/playwright` data-driven WCAG 2.1 A/AA sweep over Storybook `/index.json` with a burn-down baseline (`tests/browser/a11y.spec.ts`, `axe-baseline.json`); `@storybook/addon-a11y` wired in `.storybook/main.ts`; manual checklist (`docs/accessibility-manual-checklist.md`); runs inside `verify` → CI with zero CI edits. _ESLint/`jsx-a11y` deferred — low value against RN `accessibility_` props per the audit; the axe gate + manual checklist carry enforcement.\*

### F1 — Design-token contrast pass (`theme.tsx`)

_Unblocks 1.4.11 (AA) and 1.4.3 (AA) findings in **every** component._

| Item                                          | Criterion (Level)                    | Sev  | Location                                                                                                                                                                                                                                        | Fix                                                                                                                                                                                                                                         | Effort |
| --------------------------------------------- | ------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Resting interactive boundary token too low    | 1.4.11 Non-text Contrast (AA)        | High | `theme.tsx` (`border` ~1.24:1, `border2` ~1.45:1) applied at `inputStyles.ts:118`, `buttonStyles.ts:69`, `dateFieldStyles.ts:36`, `dropdownSelectorStyles.ts:38`, `segmentedControlStyles.ts:70`, `radioCardStyles.ts:10`, `switchStyles.ts:74` | Introduce a dedicated **control-boundary token** ≥3:1 vs surface AND vs bg (≈`#9aa39b`-luminance) for form-control edges; keep `border`/`border2` for decorative dividers (which are **exempt** from 1.4.11). Update default + Juno themes. | M      |
| `faint` placeholder text fails                | 1.4.3 Contrast (AA)                  | High | `theme.tsx` (`faint #a8aea7` ~2.26:1); `InputFrame.tsx:141`, `dateFieldStyles.ts:62`, `dropdownSelectorStyles.ts:127`                                                                                                                           | Darken `faint` (or add a placeholder token) to ≥4.5:1 on surface. Don't use placeholders as the only label (also 3.3.2 A).                                                                                                                  | S      |
| `muted` body text borderline/failing on tints | 1.4.3 Contrast (AA)                  | Med  | `theme.tsx` (`muted #737b75`: 4.36:1 surface, 3.85:1 soft, 3.66:1 primarySoft) — heatmap/segmented/calendar/dropdown/input/date hint, `radioCardStyles.ts:18`                                                                                   | Darken default `muted` to clear 4.5:1 on the _lightest_ background it actually paints on (primarySoft/soft), or restrict `muted` to large-text contexts and use `ink2` for ≤12px secondary text.                                            | S      |
| Juno `amber` text fails                       | 1.4.3 (AA)                           | Med  | Juno `amber #C28C3A` ~2.96:1; `dropdownListStyles.ts:9`                                                                                                                                                                                         | Darken Juno amber (or a dedicated amber-text token) to ≥4.5:1 on surface and on soft/primarySoft.                                                                                                                                           | S      |
| `rose`-on-`roseSoft` fails                    | 1.4.3 (AA)                           | Med  | `buttonStyles.ts:78-84`, `dropdownSelectorStyles.ts:76-88` (`rose`/`roseSoft` ~4.37:1)                                                                                                                                                          | Darken `rose` or lighten `roseSoft` so the pair clears 4.5:1 (danger chips, map-invalid text). Standalone danger label on surface already passes.                                                                                           | S      |
| `primaryBorder` on `primarySoft` invisible    | 1.4.11 (AA)                          | Med  | `dropdownSelectorStyles.ts:63-75` (~1.13:1)                                                                                                                                                                                                     | Use `primary` (≈4.2:1 vs primarySoft) for the map/pill selector boundary.                                                                                                                                                                   | S      |
| Disabled-by-opacity stacks below threshold    | 1.4.11 (AA — **disabled is exempt**) | Low  | `buttonStyles.ts:85`, `switchStyles.ts:80`, `wheelPickerStyles.ts:46` (0.28 on faint)                                                                                                                                                           | Not a hard failure (disabled exempt), but replace stacked opacity with defined disabled tokens for the worst offenders (wheel, switch off-track) so they stay perceivable.                                                                  | S      |

### F2 — Shared focus-visible indicator (`focusRing.ts`)

_Unblocks 2.4.7 (AA) findings in Switch, Segmented pill, Toast close, Modal close, Heatmap, Date cells, Dropdown._

| Item                                            | Criterion (Level)                      | Sev  | Location                                                                 | Fix                                                                                                                                                                                                                                                                                                                                                  | Effort |
| ----------------------------------------------- | -------------------------------------- | ---- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `useFocusRing` only recolors an existing border | 2.4.7 Focus Visible (AA) / 1.4.11 (AA) | High | `focusRing.ts:18-21` (verified: returns only `{ borderColor: primary }`) | Change `focusRingStyle` to a **width-bearing, border-independent indicator** — a `boxShadow` ring mirroring the button pattern (`buttonStyles.ts:90-92`: surface inner band + primary outer ring, ≥3:1 vs surface). Audit all consumers (Radio, Segmented, DropdownSelector, InputFrame already have a border; pill/switch do not) after the change. | M      |
| Forced-colors / high-contrast resilience        | 1.4.11 (AA)                            | Med  | `focusRing.ts` (JS-state border, not `outline`/`:focus-visible`)         | Prefer an `outline`-based indicator so the ring survives Windows forced-colors mode (a `borderColor`/`boxShadow` can be flattened). Verify in the manual checklist.                                                                                                                                                                                  | M      |

After F2, wire the ring everywhere it's missing (these become trivial per-component tasks): Switch (`Switch.tsx:55-65`), Segmented pill (`SegmentedControl.tsx:138`), Toast close (`Toast.tsx:123-127`), Modal close + surface fallback (`WebModalFrame.web.tsx:209-219`), Heatmap (reconcile `heatmapStyles.ts:21-24` hardcoded ink ring), Date calendar/wheel Pressables (`CalendarMonth.tsx`, `DateWheel.tsx`).

### F3 — Web keyboard helper + roving-tabindex / arrow-nav controller

_Unblocks 2.1.1 (A) / 2.4.3 (A) / 4.1.2 (A) for Radio group, Segmented, Calendar grid, Heatmap grid, Combobox._

| Item                                                                  | Criterion (Level)                     | Sev  | Location                                                                                                                                          | Fix                                                                                                                                                                                                                                | Effort |
| --------------------------------------------------------------------- | ------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| RNW `TextInput` swallows forwarded `onKeyDown` (combobox dead on web) | 2.1.1 Keyboard (A)                    | High | `useComboboxNavigation.ts:43-82` → consumed at `ComboboxMultiSelect.tsx:91` (verified: `{...navigation.keyProps}` spread onto a bare `TextInput`) | Extract the document-level capture-listener pattern already used in `useDropdownSelectorNavigation.ts:118-130` into a reusable hook; route combobox keys through it instead of the dead `onKeyDown` prop.                          | M      |
| No reusable roving-tabindex / arrow-nav controller                    | 2.1.1 (A) / 4.1.2 (A)                 | High | (new shared util; model on `dropdownNavigation.ts`)                                                                                               | Build a shared `useRovingTabIndex` controller (ArrowUp/Down/Left/Right, Home/End, wrap, skip disabled, move DOM focus, set web `tabIndex 0/-1`) reused by Radio group, Segmented, Calendar, Heatmap. Web-gate the DOM-focus moves. | M      |
| Document the implicit RNW button-key synthesis                        | 2.1.1 (A — fragile/version-dependent) | Low  | `Button.tsx:82-117`, `CalendarMonth.tsx`, `DropdownList.tsx:201-209`                                                                              | Add a code comment that Enter/Space activation is intentionally delegated to RNW for `role=button`, and add a Playwright test asserting it (catches future RNW regressions).                                                       | S      |

### F4 — Live-region / announcer utility

_Unblocks 4.1.3 (AA) for Combobox filter, Calendar month, Date/DateRange errors, drag-select count, persistent Toast region._

| Item                                   | Criterion (Level)                      | Sev  | Location                                                                     | Fix                                                                                                                                                                                                                                    | Effort |
| -------------------------------------- | -------------------------------------- | ---- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| No reusable polite/assertive announcer | 4.1.3 Status Messages (AA)             | High | (new shared util)                                                            | Add a visually-hidden live-region helper (`accessibilityLiveRegion`/literal `aria-live`, polite default, `aria-atomic`) plus an always-mounted persistent container pattern.                                                           | S      |
| Toast region created with its content  | 4.1.3 (AA — fragile across SR/browser) | High | `ToastViewport.web.tsx:36-58` (returns `null` when empty), `Toast.tsx:88-92` | Mount a **persistent, empty** `role=status`/`role=alert` live-region pair with the provider; inject toast text into it rather than putting `aria-live` on a node born with its content. Add `aria-atomic`. Verify NVDA+FF / VO+Safari. | M      |

### F5 — Reduced-motion handling

_Best-practice (2.3.3 is **AAA**, not required for AA). Gate motion across Switch, Date sheet/wheel._

| Item                                 | Criterion (Level)                              | Sev | Location                                                                   | Fix                                                                                                                                                                                                                                                                      | Effort |
| ------------------------------------ | ---------------------------------------------- | --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| No `prefers-reduced-motion` anywhere | 2.3.3 Animation from Interactions (**AAA/bp**) | Med | `Switch.tsx:27-30,75`; `DatePickerOverlay.tsx:39`; `DateWheel.tsx:199-216` | Add a shared `useReducedMotion()` (web `matchMedia('(prefers-reduced-motion: reduce)')` + change listener; native `AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged`). Gate Switch knob transition, native sheet `animationType`, wheel animated scrolls. | M      |

### F6 — Automated testing harness + governance

_The enforcement floor. Add first (Phase 0) so all subsequent fixes are guarded._

| Item                                           | Criterion (Level)                           | Sev  | Location                                                                    | Fix                                                                                                                                                                                                                                                                                                                                                                      | Effort |
| ---------------------------------------------- | ------------------------------------------- | ---- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| No axe scan                                    | 4.1.2/1.3.1/1.1.1/1.4.3 (axe subset, A/AA)  | High | `tests/browser/a11y.spec.ts` (new)                                          | Add `@axe-core/playwright` + `axe-core`. **Data-driven sweep**: fetch served Storybook `/index.json`, iterate `type==='story'`, `goto /iframe.html?id=…&viewMode=story`, run `new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()`, assert no (non-baselined) violations. Reuses `playwright.config.ts:9-17`.                                                | M      |
| Story enumeration rots                         | (testing infra)                             | Low  | `storybook.spec.ts` hardcodes ~53 ids                                       | Self-updating enumeration via `/index.json` so new stories are auto-scanned; small explicit deny-list for stories needing rule disables.                                                                                                                                                                                                                                 | S      |
| Baseline for triaged violations                | (governance)                                | High | `axe-baseline.json` (new)                                                   | Check in a baseline of accepted/triaged violations (e.g. the RNW `aria-selected`-on-button gap at `storybook.spec.ts:843`), each with written justification, so the gate fails only on **new** regressions; burn the baseline down over time.                                                                                                                            | S      |
| Not gated in CI                                | (governance)                                | High | `package.json` `verify`; `xtask/src/check.rs:9`; `.github/workflows/ci.yml` | Place `a11y.spec.ts` in `tests/browser/` so the existing `test:browser` run (inside `verify` → `cargo xtask check`) picks it up with **zero CI edits**. Align the Playwright `webServer` to serve the built `storybook-static` so axe scans the shipped bundle.                                                                                                          | S      |
| No authoring-time feedback                     | (process)                                   | Med  | `.storybook/main.ts`, `.storybook/preview.tsx`                              | Add `@storybook/addon-a11y` (live axe panel). Keep the Playwright sweep as the source of truth (addon only runs when Storybook is open) to avoid double-maintenance.                                                                                                                                                                                                     | S      |
| ESLint absent                                  | (preventive)                                | Med  | repo root (no eslint)                                                       | Add `typescript-eslint` + `eslint-plugin-jsx-a11y` with **low expectations** — jsx-a11y only understands raw-DOM JSX in `.web.tsx`/`.storybook`, not RN `accessibility*` props. Higher value: a small custom rule / grep test asserting interactive RN primitives carry `accessibilityRole` + a name; codify MEMORY gotchas (ban `dataSet`, ban problem lucide imports). | M      |
| No dynamic-behavior interaction-test checklist | 2.1.1/2.1.2/2.4.7/2.4.3/4.1.3/1.4.13 (A/AA) | High | extend `storybook.spec.ts`                                                  | Formalize a per-component **interaction-test checklist** (Enter+Space activation; arrow-nav for composites; focus trap+restore; Escape order; visible focus ring on keyboard focus; live-region role on toasts). axe is a static scanner and cannot see these — keep them scripted.                                                                                      | M      |
| No manual checklist                            | (process)                                   | Med  | `docs/accessibility-manual-checklist.md` (new)                              | Release-time checklist: keyboard-only, VoiceOver+NVDA, 200% zoom / 320px reflow (1.4.10 AA, 1.4.12 AA), reduced-motion, forced-colors. Reference from AGENTS.md / PR template. **Do not** add jest-axe/node-side checks — RNW emits no DOM under `node --test`.                                                                                                          | M      |

---

## 4. Per-Component Workstreams

> **Implementation status — all 13 component workstreams IMPLEMENTED ✅**
> Each component adopted the Phase-0 foundations and its AA-required items below. Verified green: `typecheck`, `build`, `test:package`, `storybook:build`, **196 unit tests**, and **64 Playwright interaction tests**. Per component:
>
> - [x] 4.1 Button — busy/`aria-busy` state, icon-only name enforcement (discriminated union + `devWarn`), decorative-icon hiding, `controlBorder` boundary, reduced-motion spinner.
> - [x] 4.2 Input — error/hint association via `nativeID`+`aria-describedby`/`aria-errormessage`, `aria-labelledby`, `role="alert"` error, input-purpose stories, `placeholder`/`controlBorder` tokens.
> - [x] 4.3 Switch — focus ring on the borderless track, accessible-name requirement, non-color cue, track/knob contrast _(color-contrast burn-down in progress)_.
> - [x] 4.4 Radio — new `RadioCardGroup` (`radiogroup`) + roving tabindex/arrow nav, non-color selection cue, fixed a render-loop regression.
> - [x] 4.5 Segmented — arrow-nav + roving tabindex, pill focus ring, non-color selected cue.
> - [x] 4.6 Avatar — `role="image"`, hidden initials, `decorative` opt-out, contrast-safe amber.
> - [x] 4.7 Popover — focus into/restore, `role`+name, `aria-haspopup`/`aria-controls`.
> - [x] 4.8 Modal — `aria-labelledby` heading, background `inert`, labelled close, focus-trap recovery.
> - [x] 4.9 Toast — persistent live region (`ToastLiveRegion`) + `aria-atomic`, close-button ring.
> - [x] 4.10 Dropdown — `option`/`menuitem` row roles + `aria-activedescendant`, combobox keyboard via document capture, expanded state, result-count announce _(a few aria/contrast items in burn-down)_.
> - [x] 4.11 Date — calendar grid keyboard + `dialog` role + Escape/focus mgmt, wheel spinbuttons, error/label association, month/validation announce.
> - [x] 4.12 Heatmap — grid keyboard + roles, cell value/label, legend cue, contrast (resolved `aria-prohibited-attr`).
> - [x] 4.13 drag-select — keyboard selection alternative, item name/role/value, grouping, selection-count announce _(aria-required-children/contrast in burn-down)_.

Items are tagged `[Criterion № Name (Level)] — Severity — file:line`. Where a fix is delivered by a Foundation, it is noted as _(via F#)_. `(AAA/bp)` items are tracked, not AA-gating.

### 4.1 Button (`src/button/`)

- **[4.1.2 Name/Role/Value: busy (A)] — High — `Button.tsx:25-44,86`** — Add optional `busy?`/`loading` prop; include `busy` in `accessibilityState` (→ `aria-busy`), block `onPress` while busy (keep focusable/announced), swap icon for spinner. **M**
- **[1.1.1 Non-text Content / 4.1.2 name: icon-only (A)] — High — `Button.tsx:118-119`** — Type-enforce that an icon-only button (no children) requires `accessibilityLabel` (discriminated union) + `__DEV__` warning when no non-empty name resolves. **M**
- **[1.1.1 decorative icon exposure (A)] — Med — `Button.tsx:118`** — Hide the leading icon from AT when a visible label exists (web `aria-hidden`; native `importantForAccessibility="no-hide-descendants"`). **S**
- **[1.4.11 boundary (AA)] — Med — `buttonStyles.ts:66-77,93`** — Raise secondary resting border to ≥3:1 _(via F1)_; document ghost's label-as-affordance decision (ghost has no border/fill at rest). **S**
- **[2.4.7 focus-visible vs focus (AA)] — Resolved — `focusRing.ts`** — The shared hook tracks actual focus separately from `:focus-visible`, gates web rings to the latter, and clears stale state through a native blur listener when a focused control becomes disabled. **M**
- **[2.1.1 native parity (A)] — Low — `Button.tsx:82-117`** — Document RNW key delegation + add regression test _(via F3)_. **S**

### 4.2 Input + InputFrame (`src/input/`)

- **[3.3.1 Error Identification (A) / 1.3.1 (A)] — Critical — `Input.tsx:53,59`, `InputFrame.tsx:139`** — Error is only concatenated into `accessibilityHint`, which RNW does **not** map to `aria-describedby`. Generate a stable `useId`, give the error `<Text>` a `nativeID`, set literal `aria-describedby`/`aria-errormessage` on the TextInput. **M**
- **[3.3.2 Labels or Instructions (A) / 1.3.1 (A)] — High — `Input.tsx:53,60`** — Wire hint via `aria-describedby` too; when both error and hint exist, reference **both** ids (stop overloading the single `accessibilityHint` slot via `error ?? hint`). **M**
- **[2.5.3 Label in Name (A)] — High — `Input.tsx:54`, `InputFrame.tsx:137-152`** — Replace `aria-label`-only naming with programmatic association: visible `<Text>` gets `nativeID`, TextInput gets `aria-labelledby`. **M**
- **[1.4.11 box border (AA)] — High — `inputStyles.ts:118-119`** — Resting border ~1.35:1 → ≥3:1 _(via F1)_. **S**
- **[1.4.3 hint text (AA)] — Med — `inputStyles.ts:92-97`** — `muted` @11px = 4.06:1 on bg → darken/resize _(via F1)_; reconsider placeholder `faint`. **S**
- **[2.4.7 / 1.4.11 focus (AA)] — Med — `InputFrame.tsx:151`, `inputStyles.ts:126`** — 1px hue-swap focus → thicken/add ring _(via F2)_. **M**
- **[1.3.5 Identify Input Purpose (AA)] — Med — `InputFrame.tsx:20,142`** — Document `autoComplete`/`inputMode` requirement; fix email/password stories to model it (`autoComplete='email'`/`'current-password'`). **S**
- **[1.1.1 meaningful suffix icon (A)] — Low — `InputFrame.tsx:167-176`** — Allow a label on a non-interactive meaningful suffix icon, or document it must be decorative; fix the `WithIcons` story Check. **S**
- **[1.4.12 Text Spacing (AA)] — Low — `inputStyles.ts:115-137`** — Prefer `minHeight` over fixed heights for box/message text. **M**

### 4.3 Switch (`src/switch/`)

- **[2.4.7 Focus Visible (AA)] — High — `Switch.tsx:55-65`** — **No focus handling at all** (verified: no `useFocusRing`, no `onFocus/onBlur`). Add `useFocusRing` + handlers + box-shadow ring on the track (borderless, so a `borderColor` ring won't show) _(via F2)_. **S**
- **[1.4.11 Non-text Contrast (AA)] — High — `switchStyles.ts:74,57`** — OFF track (`border2`, ~1.45:1) and white knob both fail. Add a ≥3:1 border to track + knob edge _(via F1)_. **M**
- **[4.1.2 accessible name (A)] — High — `Switch.tsx:18,57`** — `accessibilityLabel` optional with no fallback → anonymous switch. Require it (dev warning) or support `aria-labelledby` for the row-label pattern. **S**
- **[2.5.3 Label in Name (A)] — Med — `switch.stories.tsx:62-77`** — Provide `aria-labelledby` association so the visible row label _is_ the name; document. **S**
- **[1.4.1 Use of Color (A)] — Med — `switchStyles.ts:66,81`** — Off/on uses both color and knob position (non-color cue exists), but the off knob is ~1.45:1 so the position cue is barely perceptible. Strengthen contrast _(via F1)_; optional state glyph. **S**
- **[2.3.3 reduced-motion (AAA/bp)] — Low — `Switch.tsx:27-30`** — Gate knob transition _(via F5)_. Not AA. **S**
- **[2.1.1 Enter key (A)] — Low — `Switch.tsx:46`** — Space (required key) already works; optionally also accept Enter. Not a failure. **S**

### 4.4 RadioCard (`src/radio/`)

- **[4.1.2 / 1.3.1 radiogroup (A)] — High — `RadioCard.tsx:60-91`** — Lone `role=radio` with no owning group. Ship a `RadioCardGroup` (`role=radiogroup`, label, `aria-required`/`aria-invalid`, owns value) like `SegmentedControl.tsx:73-93`. **M**
- **[2.1.1 arrow navigation (A) / 4.1.2 roving tabindex (A)] — High — `RadioCard.tsx:49-58`** — No arrow keys / roving tabindex (only Space). Implement in the group _(via F3)_. **L**
- **[1.4.1 Use of Color (A)] — High — `radioCardStyles.ts:24-27,37-41`** — Selection is conveyed by color/tint. Add a robust non-color affordance (check glyph / thicker checked dot distinct from empty ring). **S**
- **[1.4.11 state indicator + boundary (AA)] — High — `radioCardStyles.ts:29-36,8-17`** — Unchecked dot border 1.45:1, card border 1.24:1 → ≥3:1 _(via F1)_. **M**
- **[2.4.7 / 1.4.11 focus (AA)] — High — `RadioCard.tsx:75,78`, `radioCardStyles.ts:11`** — Focus = recolor 1px border to primary, identical to checked state → invisible on checked cards. Use geometry-bearing ring _(via F2)_; place focus style after the consumer `style` so it can't be clobbered. **M**
- **[1.4.3 body text (AA)] — Med — `radioCardStyles.ts:18-23`** — `muted` @12px fails on primarySoft (3.66:1) → darker token _(via F1)_. **S**
- **[4.1.2 disabled vs read-only (A)] — Low — `RadioCard.tsx:48`] — `disabled || !onPress` conflates read-only with unwired; keep, document. **S\*\*
- **[1.4.12 Text Spacing (AA)] — Low — `radioCardStyles.ts:44-50`** — Verify fixed line heights don't clip under spacing overrides. **S**

### 4.5 SegmentedControl (`src/segmented/`)

- **[2.1.1 arrow navigation (A)] — High — `SegmentedControl.tsx:100-156`** — `radiogroup` with no arrow keys (no `onKeyDown` anywhere). Add web key handling per option _(via F3)_. **M**
- **[4.1.2 roving tabindex (A)] — High — `SegmentedControl.tsx:81-92,120-140`** — All N radios are separate tab stops. Implement roving `tabIndex` (`selected?0:-1`) _(via F3)_. **M**
- **[2.4.7 pill focus (AA)] — High — `SegmentedControl.tsx:138`, `segmentedControlStyles.ts:119-126`** — Pill has no `borderWidth`, so the borderColor-only ring is invisible. Use box-shadow ring _(via F2)_. **S**
- **[1.4.3 unselected labels (AA)] — Med — `segmentedControlStyles.ts:84,132`** — `muted` on pill track = 3.85:1; on bg = 4.06:1 → `ink2` _(via F1)_. **S**
- **[1.4.1 / 1.4.11 selected pill (AA)] — Med — `segmentedControlStyles.ts:127-130`** — Selected pill vs track = 1.13:1; add ≥3:1 border/shadow and/or label weight/underline change. **S**
- **[1.4.11 outline cell boundary (AA)] — Low — `segmentedControlStyles.ts:68-77`** — `border` 1.15:1 → higher-contrast token _(via F1)_. **S**
- **[1.4.12 Text Spacing (AA)] — Low — `SegmentedControl.tsx:141-153`** — `numberOfLines={1}` truncates; verify spacing overrides don't clip. **M**

### 4.6 Avatar (`src/avatar/`)

- **[4.1.2 / 1.1.1 role-less container (A)] — High — `Avatar.tsx:45-66`** — `aria-label` on a role-less `<div>` is unreliable. Add `accessibilityRole="image"` (→ `role="img"`) to the container. **S**
- **[1.1.1 / 4.1.2 initials exposed (A)] — High — `Avatar.tsx:56-65`** — Hide the inner initials Text from AT (web `aria-hidden`; native `importantForAccessibility="no"`) so the disc is announced once by its label, not as raw initials. **S**
- **[1.1.1 decorative use (A)] — Med — `Avatar.tsx:11-24,48`** — Add a `decorative`/`accessibilityHidden` opt-out to skip redundant avatars beside a visible label. **M**
- **[1.4.3 consumer override (AA)] — Low — `avatar.stories.tsx:22-28`** — Built-in tones pass; document the 4.5:1 contract for `textColor`/style overrides and fix the amber story (4.22:1). **S**
- **[1.4.11 disc boundary (AA)] — Low — `avatarStyles.ts:8-16`** — Soft-tone disc ~1.05:1 vs bg; content (initials) carries meaning, so disc boundary is arguably decorative. Optional 1px border. **S**

### 4.7 Popover (`src/popover/`, `src/dropdown/DropdownPortal*`)

- **[2.4.3 Focus Order (A) / 2.4.7 (AA)] — Critical — `DropdownPortal.web.tsx:120-131`, `Popover.tsx:106-123`** — **No web focus management**: no focus-into-surface on open, no restore on close. Move focus to surface/first focusable on open; restore to trigger on close (capture `document.activeElement` before open). Web-side in `DropdownPortal.web.tsx`. Expose a non-focus-managed "tooltip" opt-out. **L**
- **[4.1.2 Name/Role/Value (A)] — High — `DropdownPortal.web.tsx:122-130`** — Surface is a bare `<View>` with no role/name. Add `label` (+ optional `role='region'`/`'dialog'`) prop → `accessibilityRole` + `accessibilityLabel`. **M**
- **[1.3.1 / 4.1.2 trigger relationship (A)] — Med — `popoverModel.ts:39-47`** — Trigger sets `aria-expanded` only. Add `aria-haspopup` and `aria-controls` (stable `useId` → surface `nativeID`); keep flat so consumer `accessibilityState` can't clobber. **M**
- **[1.4.13 Content on Hover or Focus (AA)] — Med — `Popover.tsx:104`** — Press-triggered (so plain 1.4.13 hover/focus mostly N/A). Document the press model; if a hover/focus tooltip variant is intended, thread `surfaceHoverProps` + focus-triggered open + Escape-dismiss. Add an a11y section to README. **M**
- **[2.5.2 Pointer Cancellation (A)] — Low — `useDropdownDismiss.ts:40-47`** — Outside dismiss on `pointerdown`; optionally confirm on `pointerup`. Passes. **S**
- **[2.4.7 trigger focus (AA)] — Low — `Popover.tsx:99-105`** — Document that triggers must keep a visible focus indicator; ensure focused surface shows a ring once focus-into-surface lands _(via F2)_. **S**

### 4.8 Modal (`src/modal/`)

- **[1.3.1 / 4.1.2 heading association (A)] — High — `WebModalFrame.web.tsx:188-207`** — Named only via `aria-label`. Give title `nativeID` + `aria-labelledby`, add `accessibilityRole="header"` (→ `role="heading"`). **S**
- **[4.1.2 aria-modal / inertness (A)] — High — `WebModalFrame.web.tsx:190`** — `accessibilityViewIsModal` alone does not remove background from the AT tree. Set `inert`/`aria-hidden` on sibling `document.body` children on open (imperative ref/effect — RNW won't emit `inert`); restore on close. Verify the surface actually emits `aria-modal`. **M**
- **[1.3.1 / 2.4.3 / 4.1.2 backdrop control (A)] — High — `WebModalFrame.web.tsx:178-183`** — Backdrop Pressable injects a full-viewport "Close {title}" control into the AT tree/tab order. Render it as a non-focusable, AT-hidden View with a press handler. **S**
- **[2.1.2 No Keyboard Trap (A) / 2.4.3 (A) trap recovery] — Med — `WebModalFrame.web.tsx:156-168`** — Trap only engages when focus is already inside the surface (`webModalEventTargetsSurface` gate). Drop the gate; trap on every Tab while visible (the trap fn already handles `!activeInside`). Consider focusing the surface synchronously rather than `setTimeout(0)`. **S**
- **[2.4.7 / 1.4.11 close-button focus (AA)] — Med — `WebModalFrame.web.tsx:209-219`** — No managed ring (relies on UA outline). Apply `useFocusRing` _(via F2)_; add a surface focus cue. **S**
- **[2.1.2 / 2.4.3 trap test coverage (A)] — Low — `WebModalFrame.web.tsx:141-168`** — Add Playwright test: Tab wraps last→first, Shift+Tab first→last, recovery after blur-to-body _(via F6)_. **M**
- **[1.4.11 close icon (AA)] — Low — `WebModalFrame.web.tsx:221`** — `muted` passes 3:1 in both shipped themes; use `ink2` or document a `muted` min-contrast contract to protect against overrides. **S**
- **[2.5.3 Label in Name (A)] — Low — `WebModalFrame.web.tsx:210-211`** — N/A while icon-only; note if visible text is added later. **S**

### 4.9 Toast (`src/toast/`)

- **[4.1.3 Status Messages: region timing (AA)] — High — `ToastViewport.web.tsx:36-58`, `Toast.tsx:88-92`** — Each toast _is_ its own live region created with its content; viewport returns `null` when empty. Mount a persistent empty region _(via F4)_. **M**
- **[2.4.7 Focus Visible (AA)] — High — `Toast.tsx:123-127`, `toastStyles.ts:24-33`** — Close button strips the UA outline (`hideWebOutlineView`) with no replacement. Wire `useFocusRing` + ring _(via F2)_. **S**
- **[4.1.3 aria-atomic (AA)] — Med — `Toast.tsx:88-117`** — Add `aria-atomic` so title+description read as one unit _(via F4)_. **S**
- **[2.2.1 Timing Adjustable (A)] — Med — `Toast.tsx:79-86`, `toastModel.ts:70`** — Pointer/real-focus pause is a genuine strength, but virtual-cursor SR readers don't move DOM focus, so the 5s timer runs during reading. Encourage sticky toasts for important messages; add provider-level lengthen/disable option; pause when tab hidden. **M**
- **[1.4.11 tone icon (AA)] — Med — `Toast.tsx:96`** — Warning icon `amber` 2.96:1 in Juno → darken _(via F1)_. **S**
- **[1.1.1 decorative icons (A)] — Low — `Toast.tsx:96,129`** — Mark tone icon + X glyph AT-hidden so the announcement is just text. **S**
- **[1.3.1 region landmark (A)] — Low — `ToastViewport.web.tsx:40-56`** — Give the viewport `aria-label="Notifications"` (off the announcement path). **S**
- **[2.1.2 / 2.4.3 focus on dismiss (A)] — Low — `Toast.tsx:118-131`** — On dismissing a focused toast, move focus to next/prev toast or the prior element (avoid dropping to `<body>`). **M**
- **[2.5.5 Target Size (AAA/bp)] — Low — `toastStyles.ts:24-33`** — 28×28 close clears the 2.2 AA 24px floor but is tight; add `hitSlop` to reach 44. Not required for 2.1 AA. **S**

### 4.10 Dropdown family (`src/dropdown/`)

- **[4.1.2 list/option roles (A)] — Critical — `DropdownList.tsx:142-159,200-218`** — Container has no role; rows are `role=button`. Add `menu`/`listbox` to container and `menuitem`/`option` to rows (pass context down). Use `option` so `accessibilityState.selected` maps to a valid `aria-selected` (it does not on `role=button`). **M**
- **[4.1.2 active option (A)] — Critical — `useDropdownSelectorNavigation.ts` + `DropdownList.tsx:150-156`** — No `aria-activedescendant`/roving focus, so arrow keys announce nothing. Give rows stable ids; set `aria-activedescendant` on the focused trigger/input; associate the container via `aria-controls`/`aria-owns`. **L**
- **[1.3.1 / 4.1.2 combobox role (A)] — High — `DropdownSelector.tsx:143-156`, `ComboboxMultiSelect.tsx:84-92`** — Inputs lack `role=combobox`, `aria-expanded`, `aria-autocomplete`, `aria-controls`; result container has no `listbox` role. Add all (RNW forwards literal `aria-*` to the DOM input). **M**
- **[2.1.1 combobox keyboard dead on web (A)] — High — `ComboboxMultiSelect.tsx:91`** — `onKeyDown` spread onto an RNW TextInput is swallowed; route via document-level capture listener _(via F3)_. **M**
- **[4.1.3 result-count announcement (AA)] — Med — `DropdownSelector.tsx:119-122`, `ComboboxMultiSelect.tsx:136-139`** — "No matching options"/count changes silently. Add polite live region _(via F4)_. **S**
- **[3.3.1 / 1.3.1 error association (A)] — Med — `DropdownSelector.tsx:164,201`** — `aria-invalid` is set, but error content lives only in `accessibilityHint`. Associate error/hint via `aria-describedby`/`aria-errormessage` ids; concatenate both rather than `??`. **M**
- **[1.4.3 secondary/hint text (AA)] — Med — `dropdownListStyles.ts:77-83`, `dropdownSelectorStyles.ts:28-33`** — `muted`/`faint` text fail _(via F1)_. **M**
- **[1.4.11 active-row highlight (AA)] — Med — `dropdownListStyles.ts:56`** — `soft` highlight 1.13:1 → darker bg / inset ring / a ≥3:1 dot (label-color shift alone is insufficient; a left accent bar is banned — see `AGENTS.md`). **S**
- **[2.1.1 longPress/contextMenu keyboard opener (A)] — Med — `dropdownMenuModel.ts:122-142`** — Verify Arrow/Enter open survives prop merge for these gesture modes (`onKeyDown` is added in `DropdownMenu.tsx:182-185`, not in `resolveDropdownMenuTriggerProps`); always wire Enter/Space-to-open. **M**
- **[2.5.3 chip "x" Label in Name (A)] — Low — `ComboboxMultiSelect.tsx:74,80`** — Visible "x" Text vs accessible name "Remove {label}". Mark the "x" AT-hidden / use an icon. Also add `accessibilityRole="button"` to the chip remove Pressable (verified missing at `:73-81`). **S**
- **[1.4.11 box/divider boundary (AA)] — Low — `dropdownSelectorStyles.ts:39`** — _(via F1)_; dividers/footer borders are decorative (exempt). **M**
- **[2.4.7 trigger focus ring (AA)] — Low — `DropdownSelector.tsx:178-183`** — Border-color swap only (~5:1, passes but fragile) → box-shadow ring _(via F2)_. **S**
- **[1.4.13 custom hover wiring (AA)] — Low — `useDropdownHover.ts:39-48`** — Built-in hover mode handled. Document that custom hover needs `surfaceHoverProps`; dev-warn if absent. **S**
- **[2.1.1 RNW key synthesis test (A)] — Low** — _(via F3)_. **S**

### 4.11 Date family (`src/date/`)

- **[1.3.1 grid structure (A)] — High — `CalendarMonth.tsx:104-185`** — Flat list of ~42 buttons. Add web `role=grid`/`row`/`gridcell` + `columnheader` (gate `Platform.OS==='web'` — these roles are web-only). **M**
- **[2.1.1 grid + wheel keyboard (A)] — High — `CalendarMonth.tsx:166-180`, `DateWheel.tsx:282-309`** — No arrow-key grid nav / roving tabindex; wheel ScrollView `accessible={false}` with no key path. Implement APG grid keys (Arrow/Home/End/PageUp-Down) + wheel arrow-stepping _(via F3)_. **L**
- **[4.1.2 wheel spinners (A)] — High — `DateWheel.tsx:283-309,330-335`** — Expose columns as `accessibilityRole="adjustable"` + `accessibilityValue` + `onAccessibilityAction(increment/decrement)`; keep rows tappable. To avoid the RNW "labelled container merges descendants" gotcha, scope the adjustable element per column and set rows `accessible={false}` (or scope to web). **L**
- **[2.1.2 / 4.1.2 calendar popover not a dialog (A)] — High — `DatePickerOverlay.web.tsx:72-86`** — `accessibilityViewIsModal` only; no role/name/trap/restore (aria-modal alone does not trap Tab). Add `role='dialog'` + label, focus-in, trap, restore (reuse `trapWebModalFocus`). Reconsider open-on-focus vs open-on-ArrowDown so the keyboard can enter the overlay. **L**
- **[2.1.2 / 1.4.13 Escape dismiss (A/AA) calendar popover] — High — `DateField.tsx:178-180`, `useOutsideClose.ts:12-31`** — No Escape-to-close (README acknowledges; `useOutsideClose` listens only for `pointerdown`). Register the popover with `escapeLayer`. **S**
- **[3.3.1 / 1.3.1 error association (A)] — High — `DateField.tsx:105`, `DateTrigger.tsx:70-72`** — Error never tied to input (`aria-invalid` set but no message link). Thread error → `accessibilityHint` (native) + `nativeID`/`aria-describedby` (web). **M**
- **[4.1.3 validation announcement (AA)] — Med — `DateField.tsx:105`, `DateRangeField.tsx:131-133`** — Wrap error Text in `accessibilityLiveRegion="polite"`/`role="alert"` _(via F4)_. **S**
- **[4.1.3 month-change announcement (AA)] — Low — `CalendarMonth.tsx:56-78,108-138`** — Announce new month via live region on prev/next (keep off the focus path) _(via F4)_. **S**
- **[1.4.11 input border (AA)] — Med — `dateFieldStyles.ts:38`** — _(via F1)_. **S**
- **[1.4.3 weekday/hint/foot text (AA)] — Med — `webCalendarStyles.ts:34-41`, `inputStyles.ts:92-97`** — `muted` @10-11px → `ink2` _(via F1)_. **S**
- **[2.4.7 calendar/wheel focus (AA)] — Med — `CalendarMonth.tsx:107-144`, `DateWheel.tsx:330-336`** — Pressables react only to `{hovered}`; UA outline could be reset elsewhere. Add explicit focus-visible style _(via F2)_. **M**
- **[2.5.1 Pointer Gestures: wheel reachability (A)] — Low — `DateWheel.tsx:283-309`** — Tap alternative exists (passes); the increment action closes the off-screen-value gap. **M**
- **[1.4.3 / 1.4.1 disabled day/wheel text (AA — disabled exempt)] — Low — `webCalendarStyles.ts:21`, `wheelPickerStyles.ts:42-46`** — Lift far-tier (non-disabled) wheel text; keep disabled distinct from far. **S**
- **[1.3.5 Identify Input Purpose (AA)] — Low — `DateTrigger.tsx:69-107`** — Optional `inputMode`; no single standard autocomplete token for a custom-format date. **S**
- **[2.3.3 reduced-motion (AAA/bp)] — Low — `DateWheel.tsx:199-216`, `DatePickerOverlay.tsx:39`** — _(via F5)_. Not AA. **S**
- **[2.5.3 Label in Name (A)] — Low — `CalendarMonth.tsx:115-136`** — Already correct (visible "March 2026" is a substring of the name); no action. **S**

### 4.12 Heatmap (`src/heatmap/`)

- **[1.4.1 Use of Color (A)] — High — `Heatmap.tsx:238-249,183-186`** — Intensity is color-only visually; legend swatches aria-hidden + text-free. Value is in the per-cell name (good for AT). Add a pattern/border/opacity step between buckets for sighted low-vision users _(coupled with 1.4.11)_. **M**
- **[1.4.11 adjacent buckets (AA)] — High — `Heatmap.tsx:129-141,298-308`** — Most bucket transitions ~1.05-1.6:1. Add hairline cell borders and/or widen ramp lightness; or document the data-viz alternative-text allowance + recommend high-contrast custom ramps. **M**
- **[1.4.11 focus indicator (AA)] — High — `heatmapStyles.ts:21-24`** — 2px ink ring = 2.09:1 on the darkest cell. Use a contrast-independent ring (offset/double ring, contrasting with the page not the cell); reconcile with `focusRing.ts` _(via F2)_. **M**
- **[2.1.1 / 2.4.3 grid navigation (A)] — High — `Heatmap.tsx:203-253,317-354`** — ~365 tab stops, no arrow nav, no grid roles. Add roving tabindex + Arrow/Home/End/PageUp-Down + web `role=grid/row/gridcell` (web-gated) _(via F3)_. **L**
- **[1.4.3 labels (AA)] — Med — `heatmapStyles.ts:35-58`** — `muted` @10-11px fails on bg/bg2 → `ink2` _(via F1)_. **S**
- **[1.3.1 grid structure (A)] — Med — `Heatmap.tsx:203-253`** — Add row/gridcell roles (per-cell date label partly mitigates). **M**
- **[4.1.2 cell level in name (A)] — Med — `Heatmap.tsx:183-186`** — Default label has raw value; optionally include qualitative level (e.g. "(high)"); document `cell.level` via `cellAccessibilityLabel`. **S**
- **[4.1.2 legend semantics (A)] — Low — `Heatmap.tsx:294-312`** — Wrap legend in a labelled `role="group"`; keep swatches aria-hidden. **S**
- **[2.5.8 Target Size (AA in WCAG 2.2 — out of 2.1 scope) / bp] — Low — `Heatmap.tsx:109`** — 12px interactive cells are very small; add `hitSlop`. Not a 2.1 AA requirement. **S**

### 4.13 drag-select (`src/drag-select/`)

- **[2.5.1 Pointer Gestures (A) + 2.1.1 Keyboard (A)] — Critical — `DragSelectableProvider.web.tsx:256-297,340`** — Marquee is the **only** way to select; no keyboard / single-pointer alternative (touch is rejected). Add focusable targets (`role=checkbox`/`option`), Space/Enter toggle, roving arrow nav + Shift-range; document + add keyboard story. **L**
- **[4.1.2 Name/Role/Value (A)] — Critical — `DragSelectableContext.tsx:74-121`** — Targets are bare Views. Have `useDragSelectableTarget` return spreadable a11y props (`accessibilityRole`, `accessibilityState.checked/disabled`, label); add `options.label`; update README/story. **M**
- **[1.3.1 grouping (A)] — High — `DragSelectableProvider.web.tsx:338-349`** — Add `accessibilityRole='list'/'group'` + label to the container. **S**
- **[4.1.3 selection-count announcement (AA)] — High — `DragSelectableProvider.web.tsx:110-150`, `DragSelectableOverlay.web.tsx:37-43`** — Live count is visual-only (badge in a `pointerEvents=none` overlay). Add polite live region on commit _(via F4)_. **M**
- **[1.4.1 Use of Color (A)] — Med — `dragSelect.stories.tsx:244-255`** — Story distinguishes states by bg color alone; add a check icon/border tied to `accessibilityState.checked`. **S**
- **[2.4.7 Focus Visible (AA)] — Med — `DragSelectableContext.tsx:74-121`** — Add ring once targets are focusable _(via F2, contingent on the 2.1.1 fix)_. **S**
- **[2.5.3 Label in Name (A)] — Low** — Default target name to the visible label. **S**
- **[2.3.3 reduced-motion (AAA/bp)] — Low** — N/A (marquee is pointer-driven direct manipulation, not auto-motion); gate any future easing. Not AA. **S**

---

## 5. Phased Rollout

> **Status: Phases 0–2 DELIVERED ✅; Phase 3 best-practice items folded in where cheap.**
> The full `npm run verify` gate is green: format, **196 unit tests**, typecheck, build, package smoke, Storybook build, and **65 Playwright tests** (64 interaction + the axe WCAG 2.1 A/AA sweep). `axe-baseline.json` is **empty `{}`** — zero static A/AA violations across every story, in both the default and Juno themes. Remaining work is the manual screen-reader / zoom / forced-colors pass in §7 (can't be automated) and the AAA/2.2 best-practice backlog.

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3
(tooling +  (critical    (contrast +  (polish +
 foundation  NRV + kbd +  status msgs  reduced-motion
 scaffolds)  overlay      + remaining  + best-practice/
             focus)       AA)          AAA)
  ✅           ✅            ✅           ◑ (cheap items done)
```

### Phase 0 — Tooling & Baseline _(no product code yet; everything below depends on this)_

- **F6** in full: axe Playwright sweep (data-driven over `/index.json`), `axe-baseline.json`, gate inside `verify`/`test:browser` (zero CI edits, serve `storybook-static`), Storybook a11y addon, ESLint + custom RN-prop rule, interaction-test checklist, manual checklist doc.
- Establish the **baseline** of current axe violations so subsequent phases can only reduce it.
- **Scaffold the foundations** other phases consume: **F2** (focus-ring helper), **F3** (web key helper + roving-tabindex controller), **F4** (announcer) as utilities. Wiring happens per-component in later phases.
- _Dependency:_ none. _Exit:_ CI fails on new axe violations; baseline checked in; F2/F3/F4 utilities merged.

### Phase 1 — Critical Name/Role/Value, Keyboard, Overlay Focus

All **Critical** first, then **High** for NRV/keyboard/focus. Depends on F2/F3/F4 utilities from Phase 0.

**Critical**

- Input error/label association (`Input.tsx:53,59`) — 3.3.1 / 1.3.1 (A).
- Dropdown list/option roles + `aria-activedescendant` (`DropdownList.tsx:142-218`; `useDropdownSelectorNavigation.ts`) — 4.1.2 (A).
- Popover focus-into-surface + restore (`DropdownPortal.web.tsx:120-131`) — 2.4.3 (A).
- drag-select keyboard alternative + target roles (`DragSelectableProvider.web.tsx`, `DragSelectableContext.tsx`) — 2.5.1 / 2.1.1 / 4.1.2 (A).

**High (NRV / keyboard / modal & overlay focus)**

- Avatar role + hide initials (`Avatar.tsx:45-66`).
- Switch focus ring + name (`Switch.tsx:55-65`) _(F2)_.
- RadioCardGroup + arrow nav; Segmented arrow nav + roving tabindex _(F3)_.
- Modal heading association, background inertness, backdrop control, trap recovery (`WebModalFrame.web.tsx`).
- Date calendar dialog + Escape + grid keyboard + wheel spinners (`DatePickerOverlay.web.tsx`, `CalendarMonth.tsx`, `DateWheel.tsx`).
- Heatmap grid keyboard + roles (`Heatmap.tsx`) _(F3)_.
- Combobox keyboard (route via document listener) + combobox role (`ComboboxMultiSelect.tsx`) _(F3)_.
- Button busy state + icon-only name contract (`Button.tsx`).

_Exit:_ every interactive component has correct role+name+state in the axe sweep and a passing keyboard interaction test.

### Phase 2 — Contrast, Status Messages, remaining AA

- **F1 token contrast pass** (single coordinated PR to `theme.tsx` + style files), verified with axe `color-contrast` + a calibrated tool. Resolves the High/Med 1.4.11 + 1.4.3 items across Input, Switch, Radio, Segmented, Dropdown, Date, Heatmap, Toast, Avatar override, Modal close icon, Button secondary.
- **F4 announcer** wired: Toast persistent region + `aria-atomic`, Dropdown/Combobox result counts, Date validation + month change, drag-select count.
- Remaining 2.4.7 ring wiring (Toast close, Modal close, Date cells, Dropdown trigger) _(F2)_.
- 1.3.5 input-purpose docs/stories; 1.4.1 non-color affordances (Radio dot glyph, Segmented active weight, Heatmap borders, drag-select check, dropdown tone icons).
- Popover `aria-haspopup`/`aria-controls`; Modal trap browser test.

_Dependency:_ Phase 1 focus/role work (some announcements assume correct roles). _Exit:_ axe `color-contrast` clean (or baselined with justification); all dynamic updates announced.

### Phase 3 — Polish, Reduced-Motion, Best-Practice (not required for AA)

- **F5 reduced-motion** (2.3.3 AAA): Switch transition, Date sheet/wheel.
- 1.4.12 text-spacing (`minHeight`) in Input/Segmented/Radio (AA — low risk, deferred polish).
- Target-size `hitSlop` (Toast 2.5.5 AAA, Heatmap 2.5.8 WCAG-2.2).
- Avatar decorative opt-out; Toast focus-on-dismiss; Date input-purpose; disabled-token cleanup.
- Consumer-override contrast docs. `:focus-visible` gating is complete in the
  shared focus hook.

_Exit:_ AAA/best-practice backlog closed or explicitly deferred with rationale.

---

## 6. Prioritized Risk Summary

### Severity counts (per audit data)

| Severity     | Count | Notes                                                                                                               |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------------- |
| **Critical** | 6     | Input error assoc; Dropdown roles; Dropdown active-descendant; Popover focus; drag-select keyboard; drag-select NRV |
| **High**     | ~40   | Concentrated in NRV, keyboard composites, modal/overlay focus, and the F1 token-contrast cluster                    |
| **Medium**   | ~35   | Mostly 1.4.3/1.4.11 contrast, 4.1.3 announcements, 1.3.5                                                            |
| **Low**      | ~35   | Label-in-Name nits, reduced-motion (AAA), target size (AAA/2.2), disabled contrast (exempt)                         |

### Highest-risk criteria × component (Critical + High)

| Criterion (Level)                  | Components affected                                                                                                                                                | Top severity |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| **4.1.2 Name/Role/Value (A)**      | Dropdown (Critical×2), drag-select (Critical), Avatar (High), Popover (High), Date wheel (High), Switch name (High), Button busy/icon (High), Modal heading (High) | Critical     |
| **3.3.1 Error Identification (A)** | Input (**Critical**), Date (High), Dropdown (Med)                                                                                                                  | Critical     |
| **2.1.1 Keyboard (A)**             | drag-select (Critical), Radio (High), Segmented (High), Date grid/wheel (High), Heatmap (High), Combobox (High)                                                    | Critical     |
| **2.4.3 Focus Order (A)**          | Popover (**Critical**), Date calendar (High), Modal (Med)                                                                                                          | Critical     |
| **2.5.1 Pointer Gestures (A)**     | drag-select (**Critical**), Date wheel (Low — tap alt exists)                                                                                                      | Critical     |
| **1.4.11 Non-text Contrast (AA)**  | **systemic** via `border`/`border2` — Input, Switch, Radio, Segmented, Dropdown, Date, Heatmap, Toast, Modal, Button-secondary                                     | High         |
| **2.4.7 Focus Visible (AA)**       | Switch (High), Segmented pill (High), Heatmap (High), Toast close (High), Modal close (Med), Date cells (Med)                                                      | High         |
| **1.4.3 Contrast (AA)**            | `muted`/`faint`/Juno-amber/`rose` — Input, Radio, Segmented, Dropdown, Date, Heatmap                                                                               | High         |
| **4.1.3 Status Messages (AA)**     | Toast region timing (High), drag-select count (High), Dropdown (Med), Date (Med/Low)                                                                               | High         |
| **1.4.1 Use of Color (A)**         | Radio (High), Heatmap (High), Dropdown tone (High crosscut), Switch/drag-select (Med)                                                                              | High         |
| **1.3.1 Info & Relationships (A)** | Input (Critical via error), Date grid (High), drag-select grouping (High), Modal/Popover trigger rel. (High/Med), Heatmap (Med)                                    | Critical     |

**Biggest single lever:** the **F1 token contrast pass** clears the most individual High/Med findings (1.4.11 + 1.4.3) in one coordinated change. **Second lever:** the **F3 roving-tabindex / arrow-nav controller + document-level key helper** resolves the composite-widget 2.1.1 gaps across Radio, Segmented, Calendar, Heatmap, and the dead-on-web combobox.

---

## 7. Definition of Done / Acceptance

A component is **AA-conformant** when all of the following hold:

1. **Axe-clean stories** — every story for the component passes `@axe-core/playwright` with `withTags(['wcag2a','wcag2aa'])` and **no entry in `axe-baseline.json`** (any retained baseline entry has a written, RNW-specific justification, e.g. the `aria-selected`-on-button mapping at `storybook.spec.ts:843`).
2. **Documented keyboard interaction** — a per-component entry in the interaction-test checklist with passing Playwright assertions for: Enter+Space activation of every custom Pressable; Arrow/Home/End for composite widgets; focus trap-on-open + restore-on-close for modal/popover/calendar overlays; Escape dismiss order via `escapeLayer`; and a **visible focus indicator on keyboard focus** (assert the F2 ring appears via computed style after Tab).
3. **Contrast-verified tokens** — all text ≥4.5:1 (≥3:1 large), all UI-component boundaries / state indicators / focus rings ≥3:1, verified by the axe `color-contrast` rule **and** a calibrated tool, in **both** default and Juno themes. Disabled states are exempt but should remain perceivable.
4. **Programmatic relationships present** — names (`aria-labelledby`), errors/hints (`aria-describedby`/`aria-errormessage`), trigger↔surface (`aria-haspopup`/`aria-controls`/`aria-activedescendant`), and group structure (`radiogroup`/`listbox`/`menu`/`grid` + valid item roles) are emitted in the RNW DOM (verified in the built bundle, not assumed from RN props).
5. **Status messages announced** — dynamic updates (toasts, validation errors, filter result counts, calendar month changes, selection counts) reach AT via a persistent live region without moving focus.
6. **Manual SR pass** — the release checklist is completed: VoiceOver (Safari + Chrome / macOS) and NVDA (Firefox + Chrome / Windows) confirm role+name+state for each control; 200% zoom / 320px reflow shows no clipping (1.4.10 AA, 1.4.12 AA); `prefers-reduced-motion` suppresses animation (best-practice); and the focus indicator survives Windows forced-colors mode.
7. **Gate enforced** — the axe sweep + interaction tests run inside `npm run verify` → `cargo xtask check`, so every PR is blocked on regressions, and the baseline is monotonically reduced over time.

**Library-level done:** all 13 component workstreams meet the above; the six Foundations (F1–F6) are merged (F5 reduced-motion is best-practice and may ship in Phase 3 without blocking AA sign-off); the severity-count table shows **zero open Critical/High AA items** (or each remaining one carries a tracked, justified exception). AAA/best-practice items (2.3.3 reduced-motion, 2.5.5/2.5.8 target size) are tracked separately and do **not** gate AA conformance.
