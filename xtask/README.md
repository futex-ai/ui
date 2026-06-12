# xtask

`xtask` provides local repository automation for the shared Futex UI component
library. Depend on it through Cargo commands from the workspace root rather than
calling the binary directly.

## Responsibilities

- Provide one command for the full local verification suite.
- Provide one read-only AI review command matching the accounting repository
  workflow.
- Keep repository automation close to the codebase and easy to run in CI or
  locally.

## What This Crate Does

- Runs Markdown linting, whitespace checks, npm verification, Rust formatting,
  clippy, and Rust tests through `cargo xtask check`.
- Runs a read-only Codex review against `origin/main` through
  `cargo xtask review`.
- Prints each child command before running it so failures are easy to reproduce.

## Quick Start

```sh
cargo xtask check
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
- `src/check.rs` - local verification orchestration.
- `src/review.rs` - read-only Codex review wrapper.
- `src/command.rs` - command execution helper.

### Related Docs

- Root developer guide: `../README.md`
- Shared UI protocol: `../docs/protocol/shared-ui-components.md`
