//! JavaScript verification orchestration.

use std::path::Path;

use crate::command::{CommandRunner, CommandSpec};
use crate::error::Result;

pub(crate) fn run_check(runner: &dyn CommandRunner, _workspace_root: &Path) -> Result<()> {
    runner.run(&CommandSpec::new("npm").args(["run", "verify"]))
}
