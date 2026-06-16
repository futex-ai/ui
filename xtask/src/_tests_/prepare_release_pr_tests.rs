use std::cell::RefCell;
use std::fs;
use std::path::Path;

use serde_json::Value;
use tempfile::tempdir;

use crate::command::{CommandRunner, CommandSpec};
use crate::error::Result;

use super::run_prepare_release_pr;

#[test]
fn syncs_release_versions_and_formats_generated_files() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "@firna/ui");
    let runner = RecordingRunner::default();

    run_prepare_release_pr(&runner, temp.path(), "2.0.0").unwrap();

    let package_json = read_json(temp.path().join("package.json"));
    let package_lock = read_json(temp.path().join("package-lock.json"));
    assert_eq!(package_json["version"], "2.0.0");
    assert_eq!(package_lock["version"], "2.0.0");
    assert_eq!(package_lock["packages"][""]["version"], "2.0.0");
    assert_eq!(
        runner.commands(),
        vec!["npm exec prettier -- --write CHANGELOG.md package.json package-lock.json"],
    );
}

#[test]
fn rejects_mismatched_package_names_before_formatting() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "@wrong/ui");
    let runner = RecordingRunner::default();

    let error = run_prepare_release_pr(&runner, temp.path(), "2.0.0").unwrap_err();

    assert!(error.to_string().contains("expected `@firna/ui`"));
    assert!(runner.commands().is_empty());
}

#[derive(Default)]
struct RecordingRunner {
    commands: RefCell<Vec<String>>,
}

impl RecordingRunner {
    fn commands(&self) -> Vec<String> {
        self.commands.borrow().clone()
    }
}

impl CommandRunner for RecordingRunner {
    fn run(&self, command: &CommandSpec) -> Result<()> {
        self.commands.borrow_mut().push(command.display());
        Ok(())
    }
}

fn write_workspace(root: &Path, package_name: &str) {
    fs::write(
        root.join("package.json"),
        format!(
            r#"{{
  "name": "{package_name}",
  "version": "0.0.1"
}}
"#,
        ),
    )
    .unwrap();
    fs::write(
        root.join("package-lock.json"),
        format!(
            r#"{{
  "name": "{package_name}",
  "version": "0.0.1",
  "lockfileVersion": 3,
  "packages": {{
    "": {{
      "name": "{package_name}",
      "version": "0.0.1"
    }}
  }}
}}
"#,
        ),
    )
    .unwrap();
}

fn read_json(path: impl AsRef<Path>) -> Value {
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}
