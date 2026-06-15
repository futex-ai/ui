//! Command-line entry point for workspace automation.

mod check;
mod cli;
mod command;
mod error;
mod review;
mod sync_package_version;

fn main() -> std::process::ExitCode {
    cli::main()
}
