//! Synchronize release-plz's version source into npm package metadata.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{Map, Value};

use crate::error::{Error, Result};

const NPM_PACKAGE_NAME: &str = "@firna/ui";

pub(crate) fn run_sync_package_version(
    workspace_root: &Path,
    version_override: Option<&str>,
) -> Result<()> {
    let version = match version_override {
        Some(version) => version.to_owned(),
        None => read_release_version(&workspace_root.join("Cargo.toml"))?,
    };

    sync_package_json(&workspace_root.join("package.json"), &version)?;
    sync_package_lock(&workspace_root.join("package-lock.json"), &version)
}

fn read_release_version(manifest_path: &Path) -> Result<String> {
    let manifest: toml::Value = toml::from_str(&fs::read_to_string(manifest_path)?)?;
    let Some(version) = manifest
        .get("package")
        .and_then(|package| package.get("version"))
        .and_then(toml::Value::as_str)
    else {
        return Err(Error::MissingPackageMetadata {
            path: manifest_path.to_path_buf(),
            field: "package.version".to_owned(),
        });
    };
    Ok(version.to_owned())
}

fn sync_package_json(path: &Path, version: &str) -> Result<()> {
    let mut value = read_json_object(path)?;
    assert_package_name(path, &value)?;
    set_string_field(path, &mut value, "version", version)?;
    write_json(path, &Value::Object(value))
}

fn sync_package_lock(path: &Path, version: &str) -> Result<()> {
    let mut value = read_json_object(path)?;
    assert_package_name(path, &value)?;
    set_string_field(path, &mut value, "version", version)?;

    let Some(packages) = value.get_mut("packages").and_then(Value::as_object_mut) else {
        return Err(Error::MissingPackageMetadata {
            path: path.to_path_buf(),
            field: "packages".to_owned(),
        });
    };
    let Some(root_package) = packages.get_mut("").and_then(Value::as_object_mut) else {
        return Err(Error::MissingPackageMetadata {
            path: path.to_path_buf(),
            field: "packages.\"\"".to_owned(),
        });
    };
    assert_package_name(path, root_package)?;
    set_string_field(path, root_package, "version", version)?;
    write_json(path, &Value::Object(value))
}

fn read_json_object(path: &Path) -> Result<Map<String, Value>> {
    let value: Value = serde_json::from_str(&fs::read_to_string(path)?)?;
    let Some(object) = value.as_object() else {
        return Err(Error::MissingPackageMetadata {
            path: path.to_path_buf(),
            field: "object root".to_owned(),
        });
    };
    Ok(object.clone())
}

fn assert_package_name(path: &Path, object: &Map<String, Value>) -> Result<()> {
    let Some(actual) = object.get("name").and_then(Value::as_str) else {
        return Err(Error::MissingPackageMetadata {
            path: path.to_path_buf(),
            field: "name".to_owned(),
        });
    };
    if actual != NPM_PACKAGE_NAME {
        return Err(Error::PackageNameMismatch {
            path: PathBuf::from(path),
            actual: actual.to_owned(),
            expected: NPM_PACKAGE_NAME.to_owned(),
        });
    }
    Ok(())
}

fn set_string_field(
    path: &Path,
    object: &mut Map<String, Value>,
    field: &str,
    value: &str,
) -> Result<()> {
    if !object.contains_key(field) {
        return Err(Error::MissingPackageMetadata {
            path: path.to_path_buf(),
            field: field.to_owned(),
        });
    }
    object.insert(field.to_owned(), Value::String(value.to_owned()));
    Ok(())
}

fn write_json(path: &Path, value: &Value) -> Result<()> {
    let body = format!("{}\n", serde_json::to_string_pretty(value)?);
    fs::write(path, body)?;
    Ok(())
}

#[cfg(test)]
#[path = "_tests_/sync_package_version_tests.rs"]
mod sync_package_version_tests;
