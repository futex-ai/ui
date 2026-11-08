# Shared UI parts for Conductive

Status: Active. On branch `conductor/firna-ui-parts-for-conductive`, no pull request yet. The completion pull request deletes this plan.

Conductive needs dense controls and shared navigation, feedback, menu, and panel-resize parts. Add them to `@firna/ui` for web and React Native. Keep every existing API and default working.

The user selected this approach on 2026-11-08 in Conductive decision 119, option B in parallel. Option A keeps local app components. Option B moves the reusable parts into this library, then lets Conductive replace its local copies. Shared parts prevent drift in appearance and accessibility. The task authorizes implementation, a pull request, and review. The Conductive orchestrator can merge the implementation and release pull requests. This workspace must merge neither and must not publish manually.

The reference is `Firna-AI/remote-code`, branch `calummoore/conductor-alternative-architecture`, commit `74ee0fdf33050535f815232f609ca64f9f85be69`. Read `plans/follow-ups/firna-ui-missing-parts.md`, `docs/mockups/src/components/common/`, and `docs/mockups/src/design/`. A scratch checkout is at `/tmp/firna-ui-conductive-reference`. Adapt the design to this library's primitives and semantic tokens.

Contract owners:

- [Shared component requirements](../docs/protocol/shared-ui-components.md).
- A new focused contract under `docs/protocol/` for these additions.
- The area READMEs under `src/` and the root README.

## Design

These are implementation calls within the selected scope, recorded on 2026-11-07. Mockup work can refine their mechanics before implementation.

- **Orchestrator call:** Add `xs` to `ControlSize`. Buttons, fields, selectors, segmented controls, and single-line rows get a 26 px dense size. Buttons use a lighter label. Other component families can map `xs` to their `sm` metrics. All exhaustive size tables accept the new value. Existing size values retain their metrics.
- **Orchestrator call:** Add an optional compact typography scale. Its body is 13 px. Keep the current type scale as the default.
- **Orchestrator call:** Reuse `List` and `ListItem` for dense rows. Single-line `xs` rows have a 26 px minimum. Long content can increase the height.
- **Orchestrator call:** Use a shared touch-size context or helper across controls and new parts. Reuse the button's `minTouchTarget` and `hitSlop` behavior where applicable. Consumers can mark phone surfaces explicitly. Dense phone controls and rows meet a 44 px target without viewport assumptions during static rendering.
- **Orchestrator call:** Add `LinkButton` and `LinkTabs`. Web uses real anchors with destinations and current-page state. Native uses platform link opening and permits app-owned navigation callbacks. Links retain standard web navigation behavior.
- **Orchestrator call:** Add token-based `Notice` and `EmptyState` with optional icons, body content, and action slots. Notice can announce urgent messages. Neither adds an accent bar.
- **Orchestrator call:** Add an inline menu surface for static rendering. Reuse `DropdownList`, `ResponsiveMenu`, and `Sheet` for its content and phone presentation. Support the phone sheet on web and native. Keep static visibility separate from portal measurement.
- **Orchestrator call:** Add a controlled panel resize handle. Reuse the behavior of `DataGridResizeHandle` and `useDataGridColumnResize` where applicable. Support pointer or native responder dragging, keyboard adjustment on web, native accessibility adjustment, bounds, an accessible name, and current size. The caller owns panel layout and persistence.
- **Orchestrator call:** Start a Mokly catalogue for the new parts. Keep the older mockups and their open migration decisions unchanged. Use authored TSX screen components with desktop and mobile variants. Generated output stays ignored.
- **Orchestrator call:** Keep related implementation in this workspace. Run disjoint implementation domains in parallel only after their prerequisites finish. Only the orchestrator commits and runs the complete gate.

Mockup refinements, recorded on 2026-11-07:

- **Orchestrator call:** Use 12/16 labels at weight 500 for dense buttons and tabs. Use 13/18 row titles at weight 400. These metrics fit the reference and the existing token system.
- **Orchestrator call:** A dense field has a 26 px frame and a 24 px input. New dense field actions have 24 px targets. Phone inputs and separate actions have 44 px targets. The bordered phone frame can grow to 46 px. A frame without its own handler is not the input target.
- **Orchestrator call:** Keep unrelated switch geometry. Rows with larger controls can grow above 26 px. The phone helper still enforces the 44 px target floor.
- **Orchestrator call:** Offer the compact text scale through a provider and a per-text override. It remains available on web and native. The phone mockups show the existing default scale as one consumer choice.
- **Orchestrator call:** Give link tabs a label style for Graphite's font and letter case. Keep room for the shared focus glow inside a scrolling tab row.
- **Orchestrator call:** Filled tabs start from their content width and share remaining width. This keeps labels readable in the phone view, as the mockups showed. Each tab keeps its target floor when space is short.
- **Orchestrator call:** Let the caller choose a link target. Use a new-context indicator and announcement when the caller chooses a new tab. Do not infer routing or a new tab from the URL.
- **Orchestrator call:** Extend dense navigation rows with link destinations and current-page state. Reuse the list layout and link primitive, rather than turn navigation into buttons.
- **Orchestrator call:** A current navigation title uses at least weight 600. Larger row sizes keep their existing 700 title weight. Dense rows still change from 400 to 600, as drawn.
- **Orchestrator call:** Let empty-state titles use the caller's heading level. Urgent notices announce their message. Neutral notices remain ordinary content.
- **Orchestrator call:** Let a static menu's caller choose the side and alignment. Provide an in-place phone sheet for static drawing alongside the interactive sheet behavior.
- **Orchestrator call:** Let resize callers supply effective bounds that leave room for their main content. Arrow keys adjust the width. Home and End select the minimum and maximum. Use the short focus grip from the mockups.
- **Orchestrator call:** Replace the drawn new parts with real library components during integration. Keep the mockup layouts and links as consumer examples.

Package integration calls, recorded on 2026-11-08:

- **Orchestrator call:** Use the focused subpaths `link`, `notice`, `empty-state`, `panel-resize`, and `touch-surface`. They follow the existing component-family naming pattern. The menu additions stay in `popover`, and the text scale stays in `typography`.
- **Orchestrator call:** Export the new components, providers, hooks, and their public prop and entry types. Keep their internal placement, width, and metric helpers private. This gives consumers the selected parts without adding unrelated public contracts. Preserve every existing export.

Menu and resize calls, recorded on 2026-11-08:

- **Orchestrator call:** Wrap the trigger in `InlineMenu`. Its wrapper then owns stacking and outside-press exclusion without an extra anchor component or ref.
- **Orchestrator call:** Keep standard menu row metrics for every size except `xs`, and keep each size's title weight on touch rows. Existing menu designs stay available.
- **Orchestrator call:** Apply `checked` to menu choices, while listboxes keep `selected`. Notes describe the list, and the library owns the hidden decorative icon slot.
- **Orchestrator call:** Add `size` to `ResponsiveMenu`. Existing `DropdownMenu` and `ContextMenu` rows keep their design outside a touch surface.
- **Orchestrator call:** Use the existing sheet inset and center its larger close control vertically on touch surfaces. Keep the menu label as the dialog name when its visible title differs.
- **Orchestrator call:** Report a resize completion only after a width change. Use the last proposed width, so callers can store it once.
- **Orchestrator call:** Let the minimum win when bounds are inverted. The exposed maximum stays at least the minimum, which keeps the range usable.
- **Orchestrator call:** Give native resize handles 12 px of horizontal hit slop. Keep the narrow drawing and short grip.
- **Orchestrator call:** Draw resize states through `lineStyle` and `gripStyle`. The static catalogue then needs no private DOM access or extra state API.
- **Orchestrator call:** Supply English pixel text with the accessible resize value. This prevents a percentage fallback, and no current caller needs a text formatter.

No existing mechanism is replaced. Conductive's consumer migration belongs to its own repository.

## Milestone 1: Mockups

Tags: mockup

Depends on: none

Draw the parts together in desktop and phone compositions before product code changes.

- [x] Set up the new Mokly catalogue and local build/check commands without adding a CI gate. Name the local command in `AGENTS.md`. Generate output under `.context/`, outside the authored mockup tree.
- [x] Draw dense controls, small text, dense rows, link buttons, and link tabs.
- [x] Draw neutral and urgent notices, empty content, an open dense menu, a phone menu sheet, and a panel resize handle.
- [x] Keep at most five screens on each page. Link child pages from the catalogue.
- [x] Build and visually inspect the desktop and phone variants. Save screenshots under `.context/conductive-ui-parts/`.
- [x] Update this design and the remaining TODOs for problems found in the mockups.

Evidence belongs under `.context/conductive-ui-parts/`.

The mockup report is `.context/conductive-ui-parts/reports/mockups.md`. The orchestrator's independent checks are in the same folder's logs.

The options check is `.context/conductive-ui-parts/reports/plan-options.md`. The decision date follows the user's task and the Conductive follow-up record. Calls in this workspace use its UTC date.

## Milestone 2: Requirements and documentation

Depends on: 1

State the additional behavior before product implementation. Preserve the existing contract.

- [x] Add a focused protocol document for the new parts, density, link semantics, phone targets, menu keyboard behavior, and panel resizing.
- [x] Align the existing control-size contract, component coverage, and Storybook family list. Link the focused contract. Split the long shared protocol into linked requirement pages if it needs changes. Preserve requirements and existing link anchors.
- [x] Add the new catalogue commands and documentation links to the root README.
- [x] Confirm that the requirements implement the task and the reference without changing current defaults.

The requirements report is `.context/conductive-ui-parts/reports/requirements.md`. The split preserves the prior requirements and heading anchors. The contract keeps all phone targets in real layout space and applies the same completion callback to native accessibility resizing.

## Milestone 2a: Documentation homes

Depends on: 2

The split exposed existing implementation notes inside protocol requirements. Move those notes to their proper homes while keeping every observable requirement. This work does not change the app-shell contract or block the independent density implementation.

- [x] Rehome internal mechanics from the split protocol without losing requirements or old heading anchors.
- [x] Keep public API semantics, CSS/ARIA interoperability names, and consumer obligations in the protocol.
- [x] Validate the moved content and its links. Record the changes under `.context/conductive-ui-parts/`.

The movement ledger is `.context/conductive-ui-parts/documentation-homes-ledger.md`. Each implementation fact already had a code or README home. No product source changed for this milestone.

## Milestone 3: Dense sizes, typography, rows, and touch targets

Tags: ui

Depends on: 2

Delegate to the `ui implementor` action. This domain owns size tables, existing controls, typography, list rows, and the new touch-size helper.

- [x] Add the dense control size and complete every shared size table.
- [x] Add compact text while retaining the default scale.
- [x] Add dense list rows and apply the touch-size helper to the relevant controls. Size the input itself and its clear/suffix actions, as well as the outer frame.
- [x] Add stories and meaningful tests for the new behavior and unchanged defaults.
- [x] Update affected area READMEs. Run targeted checks and both typechecks.

The implementation and test evidence are in `.context/conductive-ui-parts/reports/density.md`. The source split keeps input styles and the list below 300 lines. The public additions are `xs`, `TouchSurface`, `useTouchSurface`, `TextScaleProvider`, `useTextScale`, and a per-text `scale` override. Small explicit button faces reserve real touch-target space. Dense loading rows keep the dense row height.

## Milestone 4: Link navigation and feedback

Tags: ui

Depends on: 3

Delegate to the `ui implementor` action. This domain owns the new navigation and feedback component folders and the link primitive at the platform seam.

- [x] Add link buttons and link tabs with web and native behavior. Add a web anchor and native link opening through the primitive seam. Keep platform export lists equal.
- [x] Add link destinations and current-page state to dense navigation rows without changing existing button rows.
- [x] Share the button tone/content styling and split its touched responsibilities into short files, with unchanged public exports and defaults.
- [x] Add notices and empty states with theme tokens and accessible content.
- [x] Add main-variant stories, focused tests, and area READMEs.
- [x] Run targeted checks and both typechecks.

The implementation report is `.context/conductive-ui-parts/reports/navigation-feedback.md`. The orchestrator check is `reports/navigation-feedback-orchestrator-check.md` in the same folder. Concurrent urgent-notice delivery is recorded in [its follow-up item](follow-ups/concurrent-urgent-notice-announcements.md).

## Milestone 5: Menus and panel resizing

Tags: ui

Depends on: 4

Delegate to the `ui implementor` action. Reuse existing overlay, focus, and responder behavior.

- [x] Add a dense menu that renders open in static HTML.
- [x] Apply the shared 44 px touch row metrics to selector and chip multi-select popup options as well as menu rows. Their shared list currently keeps 34 px rows. This completes the touch-target requirement before merge.
- [x] Add a phone menu sheet using the shared sheet behavior and 44 px rows.
- [x] Add a controlled resize handle with drag, keyboard, bounds, and accessible value behavior.
- [x] Add main-variant stories, focused tests, and area READMEs.
- [x] Run targeted checks and both typechecks.

The report is `.context/conductive-ui-parts/reports/menus-resize.md`. The independent check is `reports/menus-resize-orchestrator-check.md` in the same folder. The touch popup requirement is closed.

## Milestone 5a: Short source files

Tags: ui

Depends on: 5

The final size audit found existing long files that the density work changes. Split those files by responsibility under the shared 300-line rule. Keep their public APIs, rendering, tests, and behavior.

- [ ] Split the touched long component and style files into focused internal modules. Keep every existing export.
- [ ] Split the touched long story and test files. Keep every test name, assertion, story ID, and runner discovery path working.
- [ ] Update live references to moved responsibilities and tests. Keep old documentation destinations available.
- [ ] Prove output and test-inventory equivalence. Run targeted checks and both typechecks.

The source inventory and delegation prompt are under `.context/conductive-ui-parts/`. This changes structure only and needs no new mockup or requirement.

## Milestone 6: Package and visual integration

Tags: ui

Depends on: 5a

Delegate package work to the `non-ui implementor` and UI integration to the `ui implementor`. Delegate the long README splits to the `docs implementor` after the public exports are final.

- [ ] Export the parts from the root and appropriate subpath entry points on both platforms.
- [ ] Register the stories in the native Storybook host.
- [ ] Build the native Storybook JavaScript for iOS and Android in the cloud host. Record any device-only check that cannot run here.
- [ ] Replace drawn new parts in the Mokly catalogue with the actual components. Keep the same appearances, valid links, and static menu/sheet views. Link the new protocol from the entries.
- [ ] Check the built declarations and package smoke test for the new entry points.
- [ ] Record and inspect Linux screenshot and ARIA baselines for every new story.
- [ ] Prove the new tests fail on a behavior change. Run each new asynchronous or browser test ten times.
- [ ] Smoke-test the new stories and compare them with the mockups. Save test costs and evidence under `.context/`.
- [ ] Sync the final Storybook family coverage and implemented status in the docs after all parts exist.
- [ ] Split touched READMEs above 300 lines into focused guides. Preserve their content, examples, links, and heading destinations.

## Milestone 7: Checks, pull request, and review

Depends on: 6

The orchestrator owns these steps. The task requests a pull request before its review, so keep the plan until the review finishes.

- [ ] Run the early check and the complete `cargo xtask check` gate.
- [ ] Commit the additions with `feat:` and push the current branch.
- [ ] Open a draft pull request into `main`. Wait for CI and fix failures caused by this change.
- [ ] Run the `implementation-review` skill on the pushed pull request against `origin/main`.
- [ ] Check every new finding. Apply its `fix now` option, record the rest under `plans/follow-ups/`, and re-review once.
- [ ] Run the required checks after fixes. Commit, push, and wait for the final CI result.
- [ ] Delete this plan after the other required TODOs finish. Keep its dated decisions and design calls in the pull request description.
- [ ] Finalize the pull request description with the API summary, checks, review outcome, follow-ups, and release handoff. Mark it ready after review and final CI.

## Release handoff

The Conductive orchestrator reported the 5.0.0 baseline published on 2026-11-07. The additions therefore target 5.1.0 through additive `feat:` commits. The owner asked this workspace to report the pull request when the parts, checks, CI, and implementation review are ready. The owner will then review and merge the implementation and release pull requests.

## Post-merge follow-up (non-blocking)

- [ ] The owner merges this implementation and its 5.1.0 release pull request. Confirm the new published version and package exports through npm. Do not merge or publish from this workspace.
