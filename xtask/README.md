# xtask

`xtask` provides local repository automation for the shared Firna UI component
library. Depend on it through Cargo commands from the workspace root rather than
calling the binary directly.

## Responsibilities

- Provide one command for the JavaScript verification suite.
- Provide one command for preparing generated release PR files before CI runs.
- Provide one command for syncing release-plz's version into npm metadata.
- Provide one read-only AI review command matching the accounting repository
  workflow.
- Keep repository automation close to the codebase and easy to run in CI or
  locally.

## What This Crate Does

- Runs the existing npm verification suite through `cargo xtask check`.
- Prepares release-plz PR branches through `cargo xtask prepare-release-pr` by
  syncing npm metadata and formatting generated release files.
- Syncs the release metadata crate version into `package.json` and
  `package-lock.json` through `cargo xtask sync-package-version`.
- Runs a read-only Codex review against `origin/main` through
  `cargo xtask review`.
- Prints each child command before running it so failures are easy to reproduce.

## Quick Start

```sh
cargo xtask check
cargo xtask prepare-release-pr --version 0.2.0
cargo xtask sync-package-version
cargo xtask review
```

## Development

Run the standard Rust checks when changing xtask itself:

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

### Key Code

- `src/cli.rs` - command-line parsing and dispatch.
- `src/check.rs` - JavaScript verification orchestration.
- `src/prepare_release_pr.rs` - release PR generated-file preparation.
- `src/sync_package_version.rs` - release-plz to npm version synchronization.
- `src/review.rs` - read-only Codex review wrapper.
- `src/command.rs` - command execution helper.

### Related Docs

- Root developer guide: `../README.md`
- Shared UI protocol: `../docs/protocol/shared-ui-components.md`
