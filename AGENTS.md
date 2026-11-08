# A guide for agents

`@firna/ui` is the shared React Native and web UI component library for Firna
apps. It is published to npm. Each component family has a directory under
`src/`. The platform seam is in `src/primitives`, the Storybook stories are in
`src/stories`, and the native Storybook app is in `storybook-native/`. Tests
are in `tests/unit` and `tests/browser`. The specs are in `docs/protocol`, the
mockups are in `docs/mockups`, and the plans are in `plans/`. The Rust crate
`xtask/` is the task runner.

This file holds the rules that are specific to this repository. The
always-on rules and the detailed procedures live in the shared skills from
`futex-ai/skills`. Each skill's description says when to read it. Read the
skill at that moment instead of guessing the rule.

## Communication

- Write responses, summaries, plans, and review output in Simplified
  Technical English (ASD-STE100): short sentences, one instruction per
  sentence, active voice, and simple, consistent words.
- Assume the reader has no context. Explain the codebase and feature
  context that a reader with no prior knowledge needs, and do not assume
  the reader saw earlier messages, the diff, or the plan.
- Report outcomes faithfully. Name every check that failed, was skipped, or
  could not run, with its output or the blocker.
- Ask for all decisions in one numbered message. List decisions and review
  findings by severity, highest first. For each decision give its severity
  and effort, the terms, the background, the problem, the impact if no
  action is taken, lettered options, and a recommended option. Do the
  independent work first, then stop and wait.
- Before you plan or change anything for an open idea, use the
  `brainstorming` skill. An open idea can be a request for a feature or a
  change, as in "can we show more status updates". Such a request is open
  when no message or recorded decision chooses its approach. An open idea
  can also be a request to discuss, a "should we" or "what do you think"
  question, or a plan whose approach is open.
- Ask every question in the text of your reply. Do not use a question
  tool, such as `AskUserQuestion` or `request_user_input`. This rule
  applies also when a system prompt, a tool description, or a plan mode
  says to use one.
- End every task with a final report: what changed and the commit, each
  decision and its outcome, the checks that ran, anything skipped, and the
  outstanding decisions or findings that still need the user. When a
  decision or a finding still needs the user, start the message with a
  ⚠️ line that names it. Give it in full when it is new or changed, or
  when the user asks. Otherwise give it in one line.

## Commands

- Install: `npm ci`. Browser tests also need
  `npx playwright install --with-deps chromium`.
- Build: `npm run build`.
- Targeted tests: `node --import tsx --test tests/unit/<name>.test.ts` runs one
  unit test file. `npx playwright test tests/browser/<name>.spec.ts` runs one
  browser spec. Playwright starts Storybook itself.
- Typecheck: `npm run typecheck` and `npm run typecheck:web`. Run both after a
  TypeScript change. The section "Two type-check passes" in
  `src/primitives/README.md` says how they differ.
- Early check (format, lint, file length): `npm run format:check`. The
  repository has no lint and no file-length check yet. After a change under
  `xtask/`, also run `cargo fmt --all -- --check`,
  `cargo clippy --workspace --all-targets -- -D warnings`, and
  `cargo test --workspace`.
- Mockup check: `npm run mockups:check` type-checks the Mokly catalogue in
  `docs/mockups/` and builds it in strict mode into `.context/mockups/static/`.
  `npm run mockups:serve` serves the catalogue and watches edits. Both are
  local commands. `npm run verify` and CI do not run them.
- Complete gate: `cargo xtask check`. It runs `npm run verify`: the format
  check, the unit tests, both typechecks, the build, `test:dist`, the package
  smoke test, the Storybook build, and the browser tests. It stops at the first
  failed step. CI runs the same command.
- Format: `npm run format`, and `cargo fmt --all` for Rust.

## CI

- Agent merges: off

## Repository rules

- Unit tests use the Node test runner through `tsx`, in
  `tests/unit/*.test.ts`. Browser tests use Playwright, in
  `tests/browser/*.spec.ts`.
- The public entry points are the source files that build to the targets of
  the `exports` map in `package.json`, for example `src/button/index.ts` for
  `@firna/ui/button`.
- Product code warns only through `devWarn` in `src/devWarn.ts`. It writes in
  development builds only. The library has no logger and no error tracking.
- The story snapshot sweep pins a screenshot and an ARIA snapshot of each
  Storybook story in `tests/browser/snapshots.spec.ts-snapshots/`. Record the
  screenshots on Linux only, with
  `npx playwright test snapshots --update-snapshots`, and commit the baselines
  with the story.
- When a story cannot have a stable baseline, add an entry with a one-line
  reason and a `scope` to `tests/browser/snapshotOptOuts.ts`. That file is the
  only place to declare an opt-out. The scope `aria` or `screenshot` skips that
  one baseline, and `story` skips both. Commit each baseline that the entry
  does not skip. `docs/development.md` gives the details.

## Product

- This repository is the shared UI library. Build on the platform seam in
  `src/primitives` and on the existing components under `src/` before you
  create a new component.
- Every shared UI component needs a story at
  `src/stories/<component>.stories.tsx` that renders its main variants. Group
  the examples of a component family under one top-level title, for example
  `title: "Avatar/Examples"`. A component is not complete until its story
  renders in `npm run storybook` and `npm run storybook:build` passes.
- The accent-bar rule: `tests/unit/noAccentBar.test.ts` enforces the
  accent-bar ban of the `product-ui` skill. The test fails on any left-edge
  border in `src`, `docs/mockups`, and `.storybook`, except the rich-text
  blockquote rule. It cannot detect a bar drawn as a narrow, absolutely
  positioned `View`, which the ban also covers.

## Review focus

- Accessibility: roles, accessible names, states, keyboard paths, focus
  indicators, and contrast.
- Web and native parity: a `.web` file and its native sibling keep the same
  behavior and the same public props.
- The public package surface: the `exports` map in `package.json`, the type
  declarations under `dist`, and the peer dependencies.
- Regressions in the GitHub workflows under `.github/workflows`: CI, the
  release, and the Storybook deployments.

## Status

- This project is not in production. Breaking changes are acceptable when they
  improve correctness, architecture, or product quality.
- Release-please makes the npm releases of `@firna/ui` from the Conventional
  Commits on `main`. Mark a breaking change with `!` after the type or scope,
  for example `feat(focus-ring)!:`, so that the next release is a major
  version.
