//! Local verification orchestration.

use std::fs;
use std::path::Path;

use crate::command::{CommandRunner, CommandSpec};
use crate::error::Result;

pub(crate) fn run_check(runner: &dyn CommandRunner, workspace_root: &Path) -> Result<()> {
    run_script_checks(runner, workspace_root)?;
    runner.run(&CommandSpec::new("npm").args(["run", "verify"]))?;
    runner.run(&CommandSpec::new("cargo").args(["fmt", "--all", "--", "--check"]))?;
    runner.run(&CommandSpec::new("cargo").args([
        "clippy",
        "--workspace",
        "--all-targets",
        "--",
        "-D",
        "warnings",
    ]))?;
    runner.run(&CommandSpec::new("cargo").args(["test", "--workspace"]))?;
    Ok(())
}

fn run_script_checks(runner: &dyn CommandRunner, workspace_root: &Path) -> Result<()> {
    let markdown_files = markdown_files(workspace_root)?;
    if !markdown_files.is_empty() {
        let mut args = vec!["--yes".to_owned(), "markdownlint-cli2".to_owned()];
        args.extend(markdown_files);
        runner.run(&CommandSpec::new("npx").args(args))?;
    }
    runner.run(&CommandSpec::new("git").args(["diff", "--check"]))?;
    Ok(())
}

fn markdown_files(workspace_root: &Path) -> Result<Vec<String>> {
    let mut files = Vec::new();
    collect_markdown_files(workspace_root, workspace_root, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_markdown_files(root: &Path, path: &Path, files: &mut Vec<String>) -> Result<()> {
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();
        if should_skip_dir(&entry_path) {
            continue;
        }
        if entry_path.is_dir() {
            collect_markdown_files(root, &entry_path, files)?;
            continue;
        }
        if entry_path.extension().and_then(|value| value.to_str()) == Some("md") {
            files.push(relative_path(root, &entry_path));
        }
    }
    Ok(())
}

fn should_skip_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|value| value.to_str())
        .is_some_and(|name| {
            matches!(
                name,
                ".git"
                    | ".context"
                    | "AGENTS.md"
                    | "CLAUDE.md"
                    | "dist"
                    | "node_modules"
                    | "playwright-report"
                    | "storybook-static"
                    | "target"
                    | "test-results"
            )
        })
}

fn relative_path(root: &Path, path: &Path) -> String {
    let relative = match path.strip_prefix(root) {
        Ok(value) => value,
        Err(_error) => path,
    };
    relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
#[path = "_tests_/check_tests.rs"]
mod check_tests;
