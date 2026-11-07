import { File, Folder, FolderOpen, Search, Upload } from "lucide-react";

import { useRowMetrics, useSurface } from "../../components/common/Surface";
import { ActionButton } from "../../components/parts/Action";
import { EmptyState } from "../../components/parts/EmptyState";
import { TextField } from "../../components/parts/Fields";
import { LinkButton } from "../../components/parts/LinkButton";
import { Row, RowList } from "../../components/parts/Rows";
import { files } from "../../fixtures/work";
import { paths } from "../../paths";
import styles from "./FilesTab.module.css";

/** The files of the project with a dense toolbar, or the first-run state. */
export function FilesTab(props: { empty: boolean }) {
  const metrics = useRowMetrics();
  const phone = useSurface() === "phone";
  if (props.empty) {
    return (
      <EmptyState
        actions={
          <>
            <ActionButton icon={Upload} tone="primary">
              Upload files
            </ActionButton>
            <LinkButton to={paths.settings}>Connect a repository</LinkButton>
          </>
        }
        icon={FolderOpen}
        level={2}
        title="Add the first files"
      >
        Upload files, or connect a repository to sync them on every push.
      </EmptyState>
    );
  }
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filter}>
          <TextField
            label="Filter files"
            placeholder="Filter files"
            prefixIcon={Search}
            value=""
          />
        </div>
        {phone ? null : <ActionButton icon={Upload}>Upload</ActionButton>}
      </div>
      <RowList bleed divided={phone} label="Files">
        {files.map((file) => {
          const Icon = file.folder ? Folder : File;
          return (
            <Row
              key={file.name}
              leading={<Icon aria-hidden size={metrics.iconSize} />}
              title={file.name}
              trailing={
                <>
                  <span className={styles.size}>{file.detail}</span>
                  <span className={styles.updated}>{file.updated}</span>
                </>
              }
            />
          );
        })}
      </RowList>
    </>
  );
}
