import { FileCode2, GitCompareArrows, PanelRightClose } from "lucide-react";

import { useRowMetrics, useSurface } from "../components/common/Surface";
import { Bar, Scroll } from "../components/layout/Desktop";
import { IconAction } from "../components/parts/Action";
import { EmptyState } from "../components/parts/EmptyState";
import { Segmented } from "../components/parts/Fields";
import { Row, RowList } from "../components/parts/Rows";
import { changes } from "../fixtures/work";
import styles from "./ChangesPanel.module.css";

const added = changes.reduce((sum, file) => sum + file.added, 0);
const removed = changes.reduce((sum, file) => sum + file.removed, 0);

/** The summary of the changes, such as "5 files · +128 −14". */
export const changeSummary = `${changes.length} files · +${added} −${removed}`;

/** One dense row for each changed file: its name, folder, and line counts. */
export function ChangeRows(props: { bleed?: boolean }) {
  const metrics = useRowMetrics();
  const phone = useSurface() === "phone";
  return (
    <RowList bleed={props.bleed} divided={phone} label="Changed files">
      {changes.map((file) => (
        <Row
          key={file.name}
          leading={<FileCode2 aria-hidden size={metrics.iconSize} />}
          title={
            <>
              {file.name}
              {file.folder ? (
                <span className={styles.folder}>{file.folder}</span>
              ) : null}
            </>
          }
          trailing={
            <>
              <span className={styles.added}>+{file.added}</span>
              <span className={styles.removed}>−{file.removed}</span>
            </>
          }
        />
      ))}
    </RowList>
  );
}

/** The changes panel of the desktop layout, or its empty state. */
export function ChangesPanel(props: { empty: boolean }) {
  return (
    <>
      <Bar>
        <h2 className={styles.title}>
          Changes
          {props.empty ? null : (
            <span className={styles.count}>{changes.length}</span>
          )}
        </h2>
        <IconAction
          icon={PanelRightClose}
          label="Hide the changes panel"
          quiet
        />
      </Bar>
      {props.empty ? (
        <EmptyState
          icon={GitCompareArrows}
          level={3}
          size="panel"
          title="Changes appear after the first push"
        />
      ) : (
        <>
          <div className={styles.filter}>
            <Segmented
              label="Show"
              options={["Changed", "All files"]}
              value="Changed"
            />
          </div>
          <Scroll padded>
            <ChangeRows />
          </Scroll>
          <p className={styles.summary}>{changeSummary}</p>
        </>
      )}
    </>
  );
}
