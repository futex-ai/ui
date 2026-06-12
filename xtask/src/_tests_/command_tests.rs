use super::CommandSpec;

#[test]
fn display_quotes_arguments_that_need_shell_escaping() {
    let command = CommandSpec::new("npm").args(["run", "script with spaces"]);

    assert_eq!(command.display(), "npm run \"script with spaces\"");
}

#[test]
fn display_leaves_safe_arguments_unquoted() {
    let command = CommandSpec::new("cargo").args(["clippy", "--workspace"]);

    assert_eq!(command.display(), "cargo clippy --workspace");
}
