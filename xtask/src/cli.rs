//! CLI parsing and command dispatch for xtask.

use std::path::PathBuf;
use std::process::ExitCode;

use clap::{Parser, Subcommand};

use crate::check::run_check;
use crate::command::{CommandRunner, RealCommandRunner};
use crate::error::{Error, Result};
use crate::review::run_review;
use crate::sync_package_version::run_sync_package_version;

#[derive(Parser, Debug)]
#[command(name = "xtask", about = "Workspace automation tasks")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Run the complete local verification suite.
    Check,
    /// Run a read-only AI code review against origin/main and local changes.
    Review,
    /// Sync release-plz's package version into npm metadata.
    SyncPackageVersion(SyncPackageVersionArgs),
}

#[derive(clap::Args, Debug)]
struct SyncPackageVersionArgs {
    /// Override the version instead of reading the root Cargo package version.
    #[arg(long)]
    version: Option<String>,
}

pub(crate) fn main() -> ExitCode {
    let runner = RealCommandRunner;
    match run(Cli::parse(), &runner) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}

fn run(cli: Cli, runner: &dyn CommandRunner) -> Result<()> {
    let workspace_root = workspace_root()?;
    match cli.command {
        Commands::Check => run_check(runner, workspace_root.as_path()),
        Commands::Review => run_review(workspace_root.as_path()),
        Commands::SyncPackageVersion(args) => {
            run_sync_package_version(workspace_root.as_path(), args.version.as_deref())
        }
    }
}

fn workspace_root() -> Result<PathBuf> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let Some(workspace_root) = manifest_dir.parent() else {
        return Err(Error::MissingWorkspaceRoot { manifest_dir });
    };
    Ok(workspace_root.to_path_buf())
}
