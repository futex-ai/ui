use std::fs;

use super::markdown_files;

#[test]
fn markdown_files_include_docs_and_skip_generated_directories() {
    let root = std::env::temp_dir().join(format!("ui-xtask-check-test-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join("docs")).expect("docs directory is created");
    fs::create_dir_all(root.join("node_modules/pkg")).expect("node_modules directory is created");
    fs::create_dir_all(root.join("storybook-static")).expect("storybook directory is created");
    fs::write(root.join("README.md"), "# Root\n").expect("README is written");
    fs::write(root.join("AGENTS.md"), "# Agent instructions\n").expect("AGENTS is written");
    fs::write(root.join("docs/protocol.md"), "# Protocol\n").expect("doc is written");
    fs::write(root.join("node_modules/pkg/ignored.md"), "# Ignored\n")
        .expect("ignored node_modules file is written");
    fs::write(root.join("storybook-static/ignored.md"), "# Ignored\n")
        .expect("ignored Storybook file is written");

    let files = markdown_files(&root).expect("markdown files are collected");

    assert_eq!(files, vec!["README.md", "docs/protocol.md"]);
    fs::remove_dir_all(root).expect("temp tree is removed");
}
