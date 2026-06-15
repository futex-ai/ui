use std::fs;
use std::path::Path;

use serde_json::Value;
use tempfile::tempdir;

use super::run_sync_package_version;

#[test]
fn syncs_package_and_lock_versions_from_cargo_manifest() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "1.2.3", "@firna/ui", true);

    run_sync_package_version(temp.path(), None).unwrap();

    let package_json = read_json(temp.path().join("package.json"));
    let package_lock = read_json(temp.path().join("package-lock.json"));

    assert_eq!(package_json["version"], "1.2.3");
    assert_eq!(package_lock["version"], "1.2.3");
    assert_eq!(package_lock["packages"][""]["version"], "1.2.3");
}

#[test]
fn explicit_version_overrides_manifest_version() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "1.2.3", "@firna/ui", true);

    run_sync_package_version(temp.path(), Some("2.0.0")).unwrap();

    let package_json = read_json(temp.path().join("package.json"));
    let package_lock = read_json(temp.path().join("package-lock.json"));

    assert_eq!(package_json["version"], "2.0.0");
    assert_eq!(package_lock["packages"][""]["version"], "2.0.0");
}

#[test]
fn mismatched_package_name_is_rejected() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "1.2.3", "@wrong/ui", true);

    let error = run_sync_package_version(temp.path(), None).unwrap_err();

    assert!(error.to_string().contains("expected `@firna/ui`"));
}

#[test]
fn missing_lockfile_root_package_is_rejected() {
    let temp = tempdir().unwrap();
    write_workspace(temp.path(), "1.2.3", "@firna/ui", false);

    let error = run_sync_package_version(temp.path(), None).unwrap_err();

    assert!(error.to_string().contains("packages.\"\""));
}

fn write_workspace(root: &Path, cargo_version: &str, package_name: &str, include_lock_root: bool) {
    fs::write(
        root.join("Cargo.toml"),
        format!(
            r#"[package]
name = "firna-ui-release"
version = "{cargo_version}"
"#,
        ),
    )
    .unwrap();
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
    let root_package = if include_lock_root {
        format!(
            r#"
    "": {{
      "name": "{package_name}",
      "version": "0.0.1"
    }}"#,
        )
    } else {
        String::new()
    };
    fs::write(
        root.join("package-lock.json"),
        format!(
            r#"{{
  "name": "{package_name}",
  "version": "0.0.1",
  "lockfileVersion": 3,
  "packages": {{
{root_package}
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
