# A guide for agents

`@firna/ui` is the shared React Native and web UI component library for Firna
apps. It is published to npm. Each component family has a directory under
`src/`. The platform seam is in `src/primitives`, and the Storybook stories are
in `src/stories`. Tests are in `tests/unit` and `tests/browser`. The specs are
in `docs/protocol`, the mockups are in `docs/mockups`, and the plans are in
`plans/`. The Rust crate `xtask/` is the task runner.

This file holds the rules that are specific to this repository. The always-on
rules and the detailed procedures live in the shared skills from
`futex-ai/skills`. Read the skill at the named moment instead of guessing the
rule. Keep this file to repository-wide rules. Put a rule for one component,
crate, or feature in the `README.md`, doc, or protocol doc next to that code.

## Shared skills

- `finish-work`: before you say work is complete, and before you commit.
- `plans`: before you create, edit, or tick a plan under `plans/`.
- `implementation-review`: after you push, before you run or apply a review.
- `deterministic-tests`: when a test flakes, or when a test would assert
  elapsed time.
- `git-commit`: before and after you commit, and when you open a pull request.
- `git-merge`: before you merge or rebase, and after each merge commit.
- `documentation`: before you edit a `README.md`, a doc, or a protocol doc, and
  when a change or a review option conflicts with a protocol doc.
- `rust`: before you edit Rust. The only Rust crate is `xtask/`.
- `mockups`: before you create or change a mockup under `docs/mockups`.
- `product-ui`: before you implement or change a component, a story, or
  user-facing copy.

## Communication

- Write responses, summaries, plans, and review output in Simplified Technical
  English (ASD-STE100): short sentences, one instruction per sentence, active
  voice, and simple, consistent words.
- Assume the reader has no context. Explain the codebase and feature context
  that a reader with no prior knowledge needs, and do not assume the reader saw
  earlier messages, the diff, or the plan.
- Report outcomes faithfully. Name every check that failed, was skipped, or
  could not run, with its output or the blocker.
- Ask for all decisions in one numbered message. For each decision give its
  severity and effort, the context, the impact if no action is taken, lettered
  options, and a recommended option. Do the independent work first, then stop
  and wait.
- End every task with a final report: what changed and the commit, each
  decision and its outcome, the checks that ran, anything skipped, and the
  outstanding decisions or review items that still need the user.

## Commands

- Install: `npm ci`. Browser tests also need
  `npx playwright install --with-deps chromium`.
- Build: `npm run build`.
- Targeted tests: `node --import tsx --test tests/unit/<name>.test.ts` runs one
  unit test file. `npx playwright test tests/browser/<name>.spec.ts` runs one
  browser spec. Playwright starts Storybook itself.
- Early check: `npm run format:check`, `npm run typecheck`, and
  `npm run typecheck:web`. After a change under `xtask/`, also run
  `cargo fmt --all -- --check`,
  `cargo clippy --workspace --all-targets -- -D warnings`, and
  `cargo test --workspace`.
- Complete gate: `cargo xtask check`. It runs `npm run verify`: the format
  check, the unit tests, both typechecks, the build, `test:dist`, the package
  smoke test, the Storybook build, and the browser tests. It stops at the first
  failed step. CI runs the same command.
- Format: `npm run format`, and `cargo fmt --all` for Rust.

## Repository rules

- Each Storybook story has two baselines in
  `tests/browser/snapshots.spec.ts-snapshots/`: a screenshot and an ARIA
  snapshot. Record the screenshots on Linux only, with
  `npx playwright test snapshots --update-snapshots`. Commit the baselines with
  the story. A story that cannot be pinned, for example one with an empty
  accessibility tree, gets an entry with a one-line reason in
  `tests/browser/snapshotOptOuts.ts` instead. That file is the only place to
  declare an opt-out. The root `README.md` gives the details.
- The mockups under `docs/mockups/` are hand-written HTML files. Edit them
  directly. There is no mockup generator and no mockup check command.

## Product

- This repository is the shared UI library. Build on the platform seam in
  `src/primitives` and on the existing components under `src/` before you
  create a new component.
- Every shared UI component needs a story at
  `src/stories/<component>.stories.tsx` that renders its main variants. Group
  the examples of a component family under one top-level title, for example
  `title: "Avatar/Examples"`. A component is not complete until its story
  renders in `npm run storybook` and `npm run storybook:build` passes.
- The accent-bar rule: never draw a left accent bar (see the `product-ui`
  skill). This includes a bar drawn as a narrow, absolutely positioned `View`.
  A thick tone-colored strip on any other edge is the same pattern and is also
  banned. The ban covers components, stories, mockups, protocol docs, and
  plans. Show tone with the icon color, a tinted fill, a uniform border, an
  inset focus or selection ring, a badge, or a dot.
- `tests/unit/noAccentBar.test.ts` enforces the ban on left borders in `src`,
  `docs/mockups`, and `.storybook`. Its allowlist holds only the rich-text
  blockquote rule. Do not add entries unless the user asks.

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

## Rules from another repository

The previous `AGENTS.md` had these rules. This repository does not have the
paths and commands that they name. They stay here until the user decides to
keep or drop them.

- Native product screens, logged-in web product screens, and logged-out web
  marketing routes belong in the Expo app under `ts/app`. Marketing routes stay
  hidden from native mobile navigation. Before you build UI under `ts/app`,
  check `ts/app/src/components`.
- Migrated mockup HTML under `docs/mockups/` is generated from `.source.tsx`
  page modules in `docs/mockups/src/pages/` and components in
  `docs/mockups/src/components/`. After a change there, run
  `npm run mockups:build`, `mockups:check`, `mockups:test`, and
  `mockups:typecheck`.
- `cargo xtask rust-file-length-lint --all` checks the 300-line cap on Rust
  files under `crates/` and `xtask/`.
- `docs/dev/rust/architecture/dependencies.md` describes how to add
  workspace-internal Rust crates.
- Seed migrations under `crates/bkf-db/seed_migrations` are immutable. A
  `*-store-pg` crate may depend on `juno-db`. `cargo xtask check` enforces the
  migration lock for Diesel and seed migrations.
