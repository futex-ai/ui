use std::ffi::OsString;
use std::path::Path;

use super::{ReviewPromptParts, codex_review_args, review_prompt_from_parts};

#[test]
fn review_prompt_describes_shared_ui_review_scope() {
    let prompt = review_prompt_from_parts(
        Path::new("/repo"),
        &ReviewPromptParts {
            status: " M README.md\n".to_owned(),
            merge_base_diff: "README.md | 2 +\n".to_owned(),
            merge_base_names: "M\tREADME.md\n".to_owned(),
            staged_diff: String::new(),
            staged_names: String::new(),
            unstaged_diff: "README.md | 2 +\n".to_owned(),
            unstaged_names: "M\tREADME.md\n".to_owned(),
            untracked: String::new(),
        },
    );

    assert!(prompt.contains("shared React and React Native UI component library"));
    assert!(prompt.contains("Review the local diff against origin/main"));
    assert!(prompt.contains("Git status:\n M README.md"));
}

#[test]
fn codex_review_uses_the_model_from_the_codex_config() {
    let args = codex_review_args(Path::new("/tmp/review"));

    assert!(!args.iter().any(|arg| arg == "--model"));
    assert!(!args.iter().any(|arg| arg == "-m"));
}

#[test]
fn codex_review_runs_read_only_in_the_review_directory() {
    let args = codex_review_args(Path::new("/tmp/review"));
    let position = |flag: &str| args.iter().position(|arg| arg == flag);

    let sandbox = position("--sandbox").map(|index| &args[index + 1]);
    let directory = position("--cd").map(|index| &args[index + 1]);
    assert_eq!(sandbox, Some(&OsString::from("read-only")));
    assert_eq!(directory, Some(&OsString::from("/tmp/review")));
    assert_eq!(args.last(), Some(&OsString::from("-")));
}
