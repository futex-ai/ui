# cargo xtask review pins a fixed Codex model

- **Severity:** Low. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-01, from `calummoore/palette-forms-overlay-discussion`.
- **Location:** `xtask/src/review.rs:24`.
- **Reason:** The review command is outside the web modal stack change, and reviews now run through the shared `implementation-review` skill instead.

- **Terms:**
  - **`cargo xtask review`:** a command of the Rust task runner in `xtask/`. It sends the local diff against `origin/main` to the Codex CLI for a read-only review.
  - **Codex provider:** the model service that a Codex CLI install sends its requests to. `~/.codex/config.toml` sets it.
- **Background:**
  - `xtask/src/review.rs` runs `codex exec` with fixed arguments: `--model gpt-5.5` and `model_reasoning_effort="xhigh"`.
  - A Codex install can use a provider that serves other model names.
  - `AGENTS.md` runs the reviews of this repository through the shared `implementation-review` skill, so this command is an optional extra.
- **Problem:** When the provider of the install does not serve `gpt-5.5`, the command fails, and the caller cannot choose another model. In one sandbox it failed twice with `model_not_found: unknown provider for model gpt-5.5`, then `[xtask/error] review command failed with status 1`.
- **Impact if no action:** The command fails on each install whose provider does not serve that model name. Reviews still run through the review skill.
- **Root question:** How does the review command run on a Codex install whose provider serves other models?
- **Options:**
  - **A.** Remove the `--model` argument, so that Codex uses the model of its own configuration. Installs that use a different default model then review with it. Effort: Small.
  - **B.** Read the model and the effort from environment variables, for example `XTASK_REVIEW_MODEL` and `XTASK_REVIEW_EFFORT`, with the current values as defaults. Document them in `xtask/README.md`. Effort: Small.
  - **C.** Remove the command, because the review skill replaced it. This removes an entry point, so it needs the user's approval. Effort: Small.
- **Left out:** Change nothing: it fails the goal on installs whose provider does not serve the model.
- **Wider fix:** None, because the problem is one fixed argument, not a class of defects.
- **Previous examples:** None found.
- **Related:** `plans/follow-ups/consumer-migration-runs-xtask-review.md`: the consumer guide still names this command as the review step. That item fixes the guide, and this item fixes the command.
- **Recommendation:** B. It keeps the current default for installs that serve the model and lets other installs choose.
- **Action:** fix after merge, apply B, because the command is outside the files of the change that found the problem.
