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

No existing mechanism is replaced. Conductive's consumer migration belongs to its own repository.

## Milestone 1: Mockups

Tags: mockup

Depends on: none

Draw the parts together in desktop and phone compositions before product code changes.

- [ ] Set up the new Mokly catalogue and local build/check commands without adding a CI gate. Name the local command in `AGENTS.md`. Generate output under `.context/`, outside the authored mockup tree.
- [ ] Draw dense controls, small text, dense rows, link buttons, and link tabs.
- [ ] Draw neutral and urgent notices, empty content, an open dense menu, a phone menu sheet, and a panel resize handle.
- [ ] Keep at most five screens on each page. Link child pages from the catalogue.
- [ ] Build and visually inspect the desktop and phone variants. Save screenshots under `.context/conductive-ui-parts/`.
- [ ] Update this design and the remaining TODOs for problems found in the mockups.

Evidence belongs under `.context/conductive-ui-parts/`.

The options check is `.context/conductive-ui-parts/reports/plan-options.md`. The decision date follows the user's task and the Conductive follow-up record. Calls in this workspace use its UTC date.

## Milestone 2: Requirements and documentation

Depends on: 1

State the additional behavior before product implementation. Preserve the existing contract.

- [ ] Add a focused protocol document for the new parts, density, link semantics, phone targets, menu keyboard behavior, and panel resizing.
- [ ] Align the existing control-size contract, component coverage, and Storybook family list. Link the focused contract. Split the long shared protocol into linked requirement pages if it needs changes. Preserve requirements and existing link anchors.
- [ ] Add the new catalogue commands and documentation links to the root README.
- [ ] Confirm that the requirements implement the task and the reference without changing current defaults.

## Milestone 3: Dense sizes, typography, rows, and touch targets

Tags: ui

Depends on: 2

Delegate to the `ui implementor` action. This domain owns size tables, existing controls, typography, list rows, and the new touch-size helper.

- [ ] Add the dense control size and complete every shared size table.
- [ ] Add compact text while retaining the default scale.
- [ ] Add dense list rows and apply the touch-size helper to the relevant controls.
- [ ] Add stories and meaningful tests for the new behavior and unchanged defaults.
- [ ] Update affected area READMEs. Run targeted checks and both typechecks.

## Milestone 4: Link navigation and feedback

Tags: ui

Depends on: 3

Delegate to the `ui implementor` action. This domain owns the new navigation and feedback component folders and the link primitive at the platform seam.

- [ ] Add link buttons and link tabs with web and native behavior. Add a web anchor and native link opening through the primitive seam. Keep platform export lists equal.
- [ ] Add notices and empty states with theme tokens and accessible content.
- [ ] Add main-variant stories, focused tests, and area READMEs.
- [ ] Run targeted checks and both typechecks.

## Milestone 5: Menus and panel resizing

Tags: ui

Depends on: 4

Delegate to the `ui implementor` action. Reuse existing overlay, focus, and responder behavior.

- [ ] Add a dense menu that renders open in static HTML.
- [ ] Add a phone menu sheet using the shared sheet behavior and 44 px rows.
- [ ] Add a controlled resize handle with drag, keyboard, bounds, and accessible value behavior.
- [ ] Add main-variant stories, focused tests, and area READMEs.
- [ ] Run targeted checks and both typechecks.

## Milestone 6: Package and visual integration

Depends on: 5

Delegate package work to the `non-ui implementor` and UI integration to the `ui implementor`.

- [ ] Export the parts from the root and appropriate subpath entry points on both platforms.
- [ ] Register the stories in the native Storybook host.
- [ ] Check the built declarations and package smoke test for the new entry points.
- [ ] Record and inspect Linux screenshot and ARIA baselines for every new story.
- [ ] Prove the new tests fail on a behavior change. Run each new asynchronous or browser test ten times.
- [ ] Smoke-test the new stories and compare them with the mockups. Save test costs and evidence under `.context/`.

## Milestone 7: Checks, pull request, and review

Depends on: 6

The orchestrator owns these steps. The task requests a pull request before its review, so keep the plan until the review finishes.

- [ ] Run the early check and the complete `cargo xtask check` gate.
- [ ] Commit the additions with `feat:` and push the current branch.
- [ ] Open a pull request into `main`. Wait for CI and fix failures caused by this change.
- [ ] Run the `implementation-review` skill on the pushed pull request against `origin/main`.
- [ ] Check every new finding. Apply its `fix now` option, record the rest under `plans/follow-ups/`, and re-review once.
- [ ] Run the required checks after fixes. Commit, push, and wait for the final CI result.
- [ ] Delete this plan after the other required TODOs finish. Keep its dated decisions and design calls in the pull request description.
- [ ] Finalize the pull request description with the API summary, checks, review outcome, follow-ups, and release handoff.

## Post-merge follow-up (non-blocking)

- [ ] The Conductive orchestrator merges PR #180 and confirms 5.0.0 on npm before this implementation pull request merges. The [existing release task](follow-ups/publish-firna-ui-5-0-0.md) owns that baseline. Then the orchestrator merges this implementation and its minor release pull request. Confirm the new published version and package exports through npm. Do not merge or publish from this workspace.
