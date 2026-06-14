# Firna UI Npm Release

## Status

Completed.

## Implementation Notes

- `release-plz update --allow-dirty --repo-url https://github.com/futex-ai/ui`
  validated the local release-plz configuration without publishing. A real
  `release-pr` run still requires GitHub credentials, so the workflow uses the
  release-plz action's documented JSON output contract.
- `npm pack --dry-run --json` after a clean package build produced
  `@firna/ui@0.1.0` with 266 entries and no files outside `README.md`,
  `package.json`, and `dist/**`.
- Post-review release automation now publishes npm from the same
  `.github/workflows/release-plz.yml` run that creates the GitHub release. The
  same workflow has a manual `publish_ref` retry path so the npm package only
  needs one trusted publisher configuration and the automatic publish path does
  not depend on a `release` event created by `GITHUB_TOKEN`.

## Goal

Turn this package into the public npm library `@firna/ui` under the Firna npm
organization, with verified package contents, consumer documentation, and an
automated release path that uses release-plz wherever it can safely own the
version, changelog, tag, and GitHub release flow.

## Investigation Summary

- The current package is already shaped like an npm library: `package.json`
  declares `@futex/ui`, `private: false`, ESM output under `dist`, typed
  subpath exports, and npm scripts for tests, typecheck, build, Storybook, and
  browser coverage.
- Root docs, component READMEs, consumer handoff docs, and the Storybook
  deployment names still use the Futex package identity.
- CI already runs `cargo xtask check`, and `xtask` delegates to the npm
  verification suite through `npm run verify`.
- Release-plz's official documentation is Cargo-oriented: configuration lives
  beside a root `Cargo.toml`, release PRs update Cargo package versions and
  changelogs, and its native publish target is a Cargo registry.
- npm's current recommended CI publish path is trusted publishing with OIDC,
  Node 22.14.0 or later, npm 11.5.1 or later, and a workflow permission for
  `id-token: write`.

Reference docs:

- <https://release-plz.dev/docs/config>
- <https://release-plz.dev/docs/github/quickstart>
- <https://docs.npmjs.com/trusted-publishers/>
- <https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/>

## Release Strategy To Validate

The preferred implementation is a manual-merge release flow: release-plz opens a
release PR, a maintainer reviews and merges that PR when ready, and npm trusted
publishing uploads the package only after that release PR merge creates the
release tag:

1. Use release-plz to calculate release versions from Conventional Commits,
   update `CHANGELOG.md`, and open the release PR.
2. Add a repository-owned version sync step so the release PR also updates
   `package.json` and `package-lock.json` to the same version release-plz will
   tag.
3. Configure release-plz with `release_always = false` so packages are released
   only when the release PR is merged.
4. Let the release workflow create the `vX.Y.Z` tag and GitHub release from the
   merged release PR.
5. Publish `@firna/ui` from a GitHub-hosted npm job in the same workflow run
   that creates the release tag and GitHub release, using npm trusted
   publishing instead of a long-lived npm token.

If release-plz cannot safely produce a release PR that includes synchronized npm
metadata, stop the implementation and document the incompatibility. The fallback
recommendation should compare:

- Option A: keep release-plz only for GitHub changelog/tag/release metadata and
  publish npm from the matching tag.
- Option B: use an npm-native release manager for this package and reserve
  release-plz for Rust crates.

## Scope Decisions

- Rename the public package to `@firna/ui`; do not keep `@futex/ui` as the
  documented package name.
- Keep existing component APIs and subpath exports unless package publication
  checks reveal a broken public boundary.
- Prefer npm trusted publishing over `NPM_TOKEN`.
- Keep `cargo xtask check` as the required local and CI verification command.
- Do not publish a new npm version for every ordinary push to `main`; batch
  releases behind the generated release PR until a maintainer merges it.
- Treat the first npm publish as a separate release milestone because the
  package may need maintainer action in npmjs.com before trusted publishing can
  be enabled.

## Non-Goals

- Migrating downstream apps to `@firna/ui` in this repo change.
- Redesigning components, theme tokens, or Storybook examples beyond package
  identity and release-readiness updates.
- Publishing a Rust crate to crates.io.
- Creating a broader monorepo or multi-package workspace unless release-plz
  compatibility requires an isolated release metadata crate.

## Milestone 1: Package Identity Contract

Summary: define the public package identity and update docs before release
automation is added.

- [x] Update `package.json` metadata for `@firna/ui`, including description,
      repository, bugs, homepage, license, keywords, and public npm
      `publishConfig`.
- [x] Update `package-lock.json` to match the renamed package metadata.
- [x] Replace documented imports from `@futex/ui` to `@firna/ui` in the root
      README, component READMEs, consumer migration docs, and protocol docs.
- [x] Decide whether Storybook should move from `futex-ui-storybook` to
      `firna-ui-storybook`; update docs and workflows if the project is renamed.
- [x] Add a package release contract section to `docs/protocol` that defines
      package name, subpath exports, peer dependency policy, release tags,
      changelog ownership, and npm publish expectations.
- [x] Keep `plans/README.md` pointing at this active plan.

## Milestone 2: Package Artifact Verification

Summary: prove the npm package contains only the intended public artifacts and
can be consumed from a packed tarball.

- [x] Run `npm pack --dry-run --json` and inspect the packaged file list.
- [x] Add or update an automated package export check if the existing tests do
      not validate every public subpath export.
- [x] Add a local smoke script or documented smoke command that packs the
      library, installs the tarball into a temporary consumer, and imports the
      root export plus each subpath export.
- [x] Verify peer dependencies are correct for React, React DOM, React Native,
      React Native Web, React Native SVG, and lucide React Native consumers.
- [x] Update the README with install, peer dependency, import, and local tarball
      smoke-test guidance discovered during verification.

## Milestone 3: Release-Plz Compatibility

Summary: validate a release-plz adapter instead of assuming release-plz can
manage npm metadata directly.

- [x] Prototype release-plz locally against this Cargo workspace and record
      exactly which files it can update for a release PR.
- [x] Decide whether to use the existing workspace package metadata or add a
      small `publish = false` release metadata crate dedicated to `@firna/ui`.
- [x] Add `release-plz.toml` with `publish = false` or `git_only = true` as
      needed, `release_always = false`, a `v{{ version }}` tag pattern, GitHub
      release settings, and a changelog path appropriate for the npm package.
- [x] Add an `xtask` command that synchronizes the release-plz version source to
      `package.json` and `package-lock.json` using structured JSON parsing.
- [x] Add Rust tests for the version synchronization command, including
      mismatched versions, missing package metadata, and lockfile updates.
- [x] Ensure the release PR workflow can create one coherent diff containing
      `CHANGELOG.md`, release-plz metadata changes, `package.json`, and
      `package-lock.json`.
- [x] Verify that an ordinary non-release push to `main` can update or create
      the release PR without publishing `@firna/ui`.
- [x] If this cannot be made robust, write the incompatibility and recommended
      fallback in the plan before continuing.

## Milestone 4: Release And Publish Workflows

Summary: add CI automation that prepares releases with release-plz and publishes
the npm package with trusted publishing.

- [x] Add a release-plz GitHub Actions workflow on `main` pushes with
      `fetch-depth: 0`, release PR permissions, release permissions,
      `release_always = false`, and concurrency matching release-plz guidance.
- [x] Ensure release-plz release execution is gated to the merged release PR
      path, not every ordinary commit merged to `main`.
- [x] Add an npm publish job triggered by release-plz's release-created output.
- [x] Configure the publish workflow with GitHub-hosted runners, Node 24,
      npm 11.5.1 or later, `registry-url: https://registry.npmjs.org`, and
      `id-token: write`.
- [x] Run `npm ci`, `cargo xtask check`, package artifact inspection, and the
      tarball consumer smoke test before `npm publish`.
- [x] Publish with public scoped package settings, using `publishConfig` and
      `npm publish --access public` where needed.
- [x] Add an idempotency guard that checks whether the target package version is
      already present on npm before publishing.
- [x] Document required maintainer setup: GitHub Actions workflow permissions,
      npm org access, trusted publisher configuration, allowed action
      `npm publish`, and whether an initial manual publish is required before
      trusted publishing can be enabled.

## Milestone 5: First Release Dry Run And Handoff

Summary: verify the release path without surprising users or publishing an
incorrect package.

- [x] Run release-plz in a dry-run or non-publishing mode if available; if not,
      run the closest safe local command and document its limitations.
- [x] Create a release PR in a test branch or validate the workflow with a
      manually dispatched dry-run path before enabling automatic publish.
- [x] Run `npm pack` and inspect the packed tarball contents.
- [x] Install the packed tarball into a temporary consumer and verify every
      documented public import path.
- [x] Confirm the package page, README rendering, public visibility, provenance
      behavior, and dist-tag expectations for the first publish.
- [x] Update `docs/consumer-migration.md` with the final `@firna/ui` install
      and migration path.

## Milestone 6: Final Verification And Review

Summary: complete the repo-required checks, commit the implementation, push it,
and run the AI review after the branch is available remotely.

- [x] Run `npm run format:check`.
- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Run `npm run storybook:build`.
- [x] Run `npm run test:browser`.
- [x] Run `cargo fmt --all -- --check` after Rust changes.
- [x] Run `cargo clippy --workspace --all-targets -- -D warnings` after Rust
      changes.
- [x] Run `cargo test --workspace` after Rust changes.
- [x] Run `cargo xtask check`.
- [x] Review the final diff against `origin/main`.
- [x] Run `git add -A`, commit the completed work with a Conventional Commit,
      and push the branch.
- [x] After the push, run `cargo xtask review`.
- [x] Report every review finding without automatically fixing it, including
      severity, context, impact, solution options, and a recommended option.
- [x] Move this plan from Active to Completed in `plans/README.md` only after
      all implementation milestones, checks, push, and review reporting are
      complete.

## Milestone 7: Post-Review Release Corrections

Summary: address selected AI review findings without reopening completed
milestones.

- [x] Move automatic npm publishing into the release-plz workflow so publishing
      does not depend on a separate GitHub release event emitted by
      `GITHUB_TOKEN`.
- [x] Keep a manually dispatched `publish_ref` fallback in the release-plz
      workflow for retrying a checked release tag.
- [x] Update release workflow tests and docs to encode the same-workflow publish
      contract.
- [x] Replace the remaining active README reference to Futex apps with Firna
      apps.
