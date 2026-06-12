use std::path::Path;

use super::{ReviewPromptParts, review_prompt_from_parts};

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
