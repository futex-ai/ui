//! Error types for workspace automation commands.

use std::path::PathBuf;

pub(crate) type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub(crate) enum Error {
    #[error("[xtask/error] command `{command}` failed with status {status}")]
    CommandFailed { command: String, status: String },
    #[error("[xtask/error] command `{command}` could not be started")]
    CommandStart {
        command: String,
        source: std::io::Error,
    },
    #[error("[xtask/error] git base `{base_ref}` is not available")]
    GitBaseUnavailable { base_ref: String },
    #[error("[xtask/error] missing workspace root for manifest dir {manifest_dir}")]
    MissingWorkspaceRoot { manifest_dir: PathBuf },
    #[error("[xtask/error] review command failed with status {status}")]
    ReviewFailed { status: String },
    #[error("[xtask/error] IO failure")]
    Io { source: std::io::Error },
    #[error("[xtask/error] child command output was not valid UTF-8")]
    Utf8 { source: std::string::FromUtf8Error },
}

impl From<std::io::Error> for Error {
    fn from(source: std::io::Error) -> Self {
        Self::Io { source }
    }
}

impl From<std::string::FromUtf8Error> for Error {
    fn from(source: std::string::FromUtf8Error) -> Self {
        Self::Utf8 { source }
    }
}
