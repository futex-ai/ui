import { FileCode2, GitCompareArrows, PanelRightClose } from "lucide-react";
import { EmptyState } from "@firna/ui/empty-state";
import { ListItem } from "@firna/ui/list";

import { Bar, Scroll } from "../components/layout/Desktop";
import { IconAction } from "../components/parts/Action";
import { Segmented } from "../components/parts/Fields";
import {
  RowDetail,
  RowIcon,
  RowList,
  RowTitle,
} from "../components/parts/Rows";
import { changes } from "../fixtures/work";
import styles from "./ChangesPanel.module.css";

const added = changes.reduce((sum, file) => sum + file.added, 0);
const removed = changes.reduce((sum, file) => sum + file.removed, 0);

/** The summary of the changes, such as "5 files · +128 −14". */
export const changeSummary = `${changes.length} files · +${added} −${removed}`;

/** One dense row for each changed file: its name, folder, and line counts. */
export function ChangeRows(props: { bleed?: boolean }) {
  return (
    <RowList
      bleed={props.bleed}
      itemKey={(file) => file.name}
      items={changes}
      label="Changed files"
      renderItem={(file) => (
        <ListItem
          leading={<RowIcon icon={FileCode2} />}
          size="xs"
          title={
            <RowTitle>
              {file.name}
              {file.folder ? (
                <span className={styles.folder}>{file.folder}</span>
              ) : null}
            </RowTitle>
          }
          trailing={
            <RowDetail>
              <span className={styles.added}>+{file.added}</span>
              <span className={styles.removed}>−{file.removed}</span>
            </RowDetail>
          }
        />
      )}
    />
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
          headingLevel={3}
          icon={GitCompareArrows}
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
