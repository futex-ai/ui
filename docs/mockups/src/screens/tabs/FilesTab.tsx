import { mockLink } from "@mokly/mokly";
import { File, Folder, FolderOpen, Search, Upload } from "lucide-react";
import { EmptyState } from "@firna/ui/empty-state";
import { LinkButton } from "@firna/ui/link";
import { ListItem } from "@firna/ui/list";

import { useSurface } from "../../components/common/Surface";
import { ActionButton } from "../../components/parts/Action";
import { TextField } from "../../components/parts/Fields";
import { RowDetail, RowIcon, RowList } from "../../components/parts/Rows";
import { files } from "../../fixtures/work";
import { paths } from "../../paths";
import styles from "./FilesTab.module.css";

/** The files of the project with a dense toolbar, or the first-run state. */
export function FilesTab(props: { empty: boolean }) {
  const phone = useSurface() === "phone";
  if (props.empty) {
    return (
      <EmptyState
        actions={
          <>
            <ActionButton icon={Upload} tone="primary">
              Upload files
            </ActionButton>
            <LinkButton href={mockLink(paths.settings)} size="xs">
              Connect a repository
            </LinkButton>
          </>
        }
        headingLevel={2}
        icon={FolderOpen}
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
      <RowList
        bleed
        itemKey={(file) => file.name}
        items={files}
        label="Files"
        renderItem={(file) => (
          <ListItem
            leading={<RowIcon icon={file.folder ? Folder : File} />}
            size="xs"
            title={file.name}
            trailing={
              <RowDetail>
                <span className={styles.size}>{file.detail}</span>
                <span className={styles.updated}>{file.updated}</span>
              </RowDetail>
            }
          />
        )}
      />
    </>
  );
}
