//! Prepare generated release PR files before CI validates them.

use std::path::Path;

use crate::command::{CommandRunner, CommandSpec};
use crate::error::Result;
use crate::sync_package_version::run_sync_package_version;

pub(crate) fn run_prepare_release_pr(
    runner: &dyn CommandRunner,
    workspace_root: &Path,
    version: &str,
) -> Result<()> {
    run_sync_package_version(workspace_root, Some(version))?;
    runner.run(&CommandSpec::new("npm").args([
        "exec",
        "prettier",
        "--",
        "--write",
        "CHANGELOG.md",
        "package.json",
        "package-lock.json",
    ]))
}

#[cfg(test)]
#[path = "_tests_/prepare_release_pr_tests.rs"]
mod prepare_release_pr_tests;
