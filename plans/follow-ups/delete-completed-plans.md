# Delete the 19 completed plans

- **Severity:** Low. **Effort:** Large. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-04, from `conductor/agents-md-ui`.
- **Location:** `plans/`, `docs/superpowers/specs/2026-08-12-video-editor-ui-design.md:3`, `src/chartScales.ts:11`, `src/primitives/dom/index.ts:9`, `src/primitives/reactNative.web.ts:6`, `src/stories/workflow.stories.tsx:293`, `src/workflow/WorkflowNode.tsx:152`, `tests/browser/snapshots.spec.ts:16`, `tests/unit/primitiveTypesCompat.test.ts:9`, and `tests/unit/primitives.test.ts:87`.
- **Reason:** The user's rule of 2026-11-04 deletes these plans, but nobody has listed them for the user, and the work starts only when the user asks.

- **Terms:**
  - **Completed plan:** a plan under `plans/` whose first paragraph below its title starts with `Status: Completed`.
  - **Follow-up item:** a file under `plans/follow-ups/`, such as this one, that records work that waits until after a merge.
  - **Live content:** text that must match the current state of the repository, such as code comments, `docs/`, and each `README.md`.
  - **`agents-md` migration:** a change that aligns the `AGENTS.md` of a repository with the shared skills of `futex-ai/skills`, as the `agents-md` skill says.
- **Background:**
  - The user's rule of 2026-11-04 deletes each plan whose work has merged.
  - The `plans` skill says: "Do not delete a completed plan that is already on `main` without the user's approval."
  - The `agents-md` migration did not list the plans of this repository for the user, so it kept them.
  - 19 plans are completed. Together they hold 7,743 lines and 14 open TODOs. The line numbers below are those at commit `b141ed2`.
  - 13 completed plans have no open TODO: `avatar-loading`, `avatar-rounded-square`, `button-consumer-capability-gaps`, `charts-design`, `dark-mode`, `firna-ui-npm-release`, `list-focus-visible-release`, `pure-react-dom-backend`, `rich-text-collaboration-visuals`, `rich-text-editor-design`, `shared-dropdown-modal-library`, `status-dot`, and `video-editor-components`.
  - `plans/charts-component-family.md` has 3 open TODOs:
    - Line 255: "Optional entry animation, gated on `useReducedMotion`. **Deferred.**"
    - Line 264: "Extend `scripts/package-smoke-stubs.mjs` for any new peer surface."
    - Line 270: "Manual on-device native pass: scrub, tap-select, `ScrollView` coexistence. **Deferred** — cannot be gated in CI, same as `DataGrid` M7." `DataGrid` M7 is the native milestone of `plans/data-grid-component.md`, which holds the TODO at its line 383.
  - `plans/data-grid-component.md` has 3 open TODOs:
    - Line 329: "Auto-scroll when dragging past the body edge. _(Deferred to M4: the body becomes scrollable with virtualization.)_" M4 is the virtualization milestone of the same plan.
    - Line 383: "Native-on-device verification (keyboard nav reliability, editor focus, scroll latency) via the Expo Storybook host — **deferred to a manual pass** (the Expo host can't run in this sandbox; see [native Storybook host setup memory]). Documented as a known-unverified surface in the README."
    - Line 410: "Release is handled by the existing `release-plz` automation on merge to `main` (do not `npm publish` by hand)." The repository releases with release-please, and `CHANGELOG.md` lists data-grid changes in released versions.
  - `plans/data-grid-context-menus.md` has 1 open TODO:
    - Line 874: "**Not done: the on-device native pass.** Long-press timing, sheet dismissal, and VoiceOver/TalkBack behaviour need a real device — the web Storybook only ever renders the `.web` code path, so none of the native branches above are exercised by the gate." The TODO adds that this pass joins the native pass at line 383 of `plans/data-grid-component.md`. It also joins the manual pass in "Definition of Done / Acceptance" of `plans/wcag-2-1-accessibility.md`.
  - `plans/disable-focus-ring.md` has 2 open TODOs. Both are review findings, with the review severities P2 and P3. M6 is the focus-indicator milestone of that plan.
    - Line 255: "Review finding (P2, predates M6): the charts never forward their prop to `ChartFrame`, so the 'Show data table' toggle ignores `focusIndicator`. Awaiting a decision on passing it through."
    - Line 258: "Review finding (P3): `plans/charts-design.md` still lists `disableFocusRing?: boolean` in `ChartCommonProps`. Awaiting a decision on updating it." The deletion of `plans/charts-design.md` removes that stale line.
  - `plans/rich-text-editor-component.md` has 4 open TODOs, in its post-v1 backlog milestone:
    - Line 208: "Links and link editing."
    - Line 209: "Nested lists."
    - Line 210: "Code-block language selection."
    - Line 211: "Drag handles and block reordering."
  - `plans/sortable-group-coordinator.md` has 1 open TODO:
    - Line 356: "**Not done: the manual screen-reader pass.** A cross-group keyboard move (grab, cross, drop, cancel) still needs listening to on a real screen reader — VoiceOver and NVDA — to confirm the destination group is spoken and the announcements are not chatty." The TODO adds that this pass joins the manual release pass in "Definition of Done / Acceptance" of `plans/wcag-2-1-accessibility.md`.
  - Some status paragraphs also keep deferred items and open review findings. For example, `plans/pure-react-dom-backend.md` has no open TODO, but its status paragraph keeps two open review findings.
  - These sections also hold deferred work, a backlog, follow-ups, or open questions:
    - `plans/avatar-loading.md` line 84: "Deferred".
    - `plans/avatar-rounded-square.md` line 660: "Follow-up (not in scope)".
    - `plans/charts-component-family.md` line 282: "M9 — Backlog (not built)".
    - `plans/dark-mode.md` line 1003: "Follow-ups (explicitly out of scope)".
    - `plans/data-grid-component.md` line 415: "Open questions".
    - `plans/data-grid-context-menus.md` line 970: "Open questions".
    - `plans/disable-focus-ring.md` line 276: "Follow-up".
    - `plans/pure-react-dom-backend.md` line 1078: "Open questions".
    - `plans/rich-text-collaboration-visuals.md` line 101: "Deferred".
  - Three plans stay, because their status is Active: `easier-component-testing-without-testid`, `sortable-list-component`, and `wcag-2-1-accessibility`.
  - These live links outside `plans/` name a completed plan:
    - `docs/superpowers/specs/2026-08-12-video-editor-ui-design.md:3` names `video-editor-components`.
    - `src/chartScales.ts:11` names `charts-design`.
    - `src/primitives/dom/index.ts:9` and `src/primitives/reactNative.web.ts:6` name `pure-react-dom-backend`.
    - `src/stories/workflow.stories.tsx:293` and `src/workflow/WorkflowNode.tsx:152` name `dark-mode`.
    - `tests/browser/snapshots.spec.ts:16`, `tests/unit/primitiveTypesCompat.test.ts:9`, and `tests/unit/primitives.test.ts:87` name `pure-react-dom-backend`.
  - Some completed plans link each other. `charts-design` and `charts-component-family` link each other. `rich-text-editor-design` and `rich-text-editor-component` link each other. `data-grid-context-menus` links `charts-component-family` and `data-grid-component`. `disable-focus-ring` links `charts-design`.
  - No active plan links a completed plan.
  - Three follow-up items name a completed plan as evidence:
    - `plans/follow-ups/mockups-meet-mockups-skill.md` names `rich-text-editor-component`, `rich-text-collaboration-visuals`, and `video-editor-components`.
    - `plans/follow-ups/mockups-choose-how-to-meet-rules.md` names `rich-text-collaboration-visuals`.
    - `plans/follow-ups/video-editor-design-spec-stale.md` names `video-editor-components`.
  - When a plan goes, replace each such name in an open follow-up item with a permalink to the plan at the commit before the deletion.
- **Task:** Do these steps for each completed plan. They follow "Deleting a plan" in the `plans` skill.
  1. Read the whole plan, with its status paragraph and each section that the list above names.
  2. Turn each open TODO, open finding, and unchecked post-merge task that has no follow-up item into a follow-up item. Keep every fact.
  3. Check that the protocol docs hold each decision in force.
  4. Search the whole repository for links to the plan, not only `docs/`, `plans/`, and the `README.md` files. Replace each live link with the new home of its fact, or with a permalink to the plan.
  5. Delete the plan, and name it in the commit message.
  6. In the pull request description, give each user decision and design call of the plan, with its date. Add a permalink to the plan at the commit before the deletion.
- **Impact if no action:** The 19 plans stay on `main` against the user's rule, and agents that search `plans/` meet 7,743 lines of history. Their open items stay hidden, because `scripts/follow-ups.sh` of the `plans` skill lists only `plans/follow-ups/`.
- **Needs:** the user's request to start the work.
- **Done when:** no plan with `Status: Completed` stays under `plans/`, each live item has its follow-up item, and no live link names a deleted plan.
- **Related:** `plans/follow-ups/video-editor-design-spec-stale.md`: it fixes or deletes the spec at `docs/superpowers/specs/2026-08-12-video-editor-ui-design.md`, which links `plans/video-editor-components.md`.
