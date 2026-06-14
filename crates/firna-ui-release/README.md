# firna-ui-release

`firna-ui-release` is a private Cargo package that gives release-plz a Rust
package boundary for the `@firna/ui` npm library. Do not depend on this crate
from application code; depend on the npm package instead.

## Responsibilities

- Track the release version that release-plz updates.
- Include package files that should trigger `@firna/ui` release PRs.
- Stay unpublished to crates.io while still allowing GitHub tags and releases.

## What This Crate Does

- Provides a tiny Cargo target so release-plz can analyze changed package files.
- Uses the root `Cargo.toml` version as the source version for npm metadata.
- Lets `cargo xtask sync-package-version` copy that version into
  `package.json` and `package-lock.json`.

## Quick Start

```sh
cargo xtask sync-package-version
cargo package --list --package firna-ui-release --allow-dirty
```

## Development

Keep this crate intentionally empty. Its job is release metadata, not runtime
logic.

### Key Code

- `src/lib.rs` - empty Cargo target required by release-plz.
- `../../release-plz.toml` - release-plz configuration.
- `../../xtask/src/sync_package_version.rs` - npm version synchronization.

### Related Docs

- Root developer guide: `../../README.md`
- Package release plan: `../../plans/firna-ui-npm-release.md`
- Shared UI protocol: `../../docs/protocol/shared-ui-components.md`
