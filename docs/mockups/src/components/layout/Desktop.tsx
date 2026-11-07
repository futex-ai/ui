import type { ReactNode } from "react";

import { detailWidth, sidebarWidth } from "../../design/density";
import { classes } from "../common/classes";
import { ResizeHandle, type HandleState } from "../parts/ResizeHandle";
import styles from "./Desktop.module.css";

/** The widths of the two side columns and the drawn state of each handle. */
export type ColumnState = {
  sidebar: { width: number; handle: HandleState };
  detail: { width: number; handle: HandleState };
};

/** The columns at their default widths, with both handles at rest. */
export const defaultColumns: ColumnState = {
  sidebar: { width: sidebarWidth.value, handle: "rest" },
  detail: { width: detailWidth.value, handle: "rest" },
};

/**
 * The desktop layout: the project list, the main column, and an optional
 * changes panel. Each side column has a resize handle on its inner edge.
 */
export function DesktopColumns(props: {
  columns: ColumnState;
  sidebar: ReactNode;
  main: ReactNode;
  detail?: ReactNode;
}) {
  const { sidebar, detail } = props.columns;
  return (
    <div className={styles.columns}>
      <aside
        aria-label="Projects"
        className={styles.sidebar}
        style={{ width: sidebar.width }}
      >
        {props.sidebar}
        <ResizeHandle
          bounds={sidebarWidth}
          edge="end"
          label="Resize the project list"
          state={sidebar.handle}
          width={sidebar.width}
        />
      </aside>
      <main
        className={classes(styles.main, props.detail ? styles.split : false)}
      >
        {props.main}
      </main>
      {props.detail ? (
        <aside
          aria-label="Changes"
          className={styles.detail}
          style={{ width: detail.width }}
        >
          <ResizeHandle
            bounds={detailWidth}
            edge="start"
            label="Resize the changes panel"
            state={detail.handle}
            width={detail.width}
          />
          {props.detail}
        </aside>
      ) : null}
    </div>
  );
}

/** A bar at the top of a column, with a hairline under it. */
export function Bar(props: { children: ReactNode; slim?: boolean }) {
  return (
    <div className={classes(styles.bar, props.slim && styles.slim)}>
      {props.children}
    </div>
  );
}

/** The scrolling content of a column. */
export function Scroll(props: { children: ReactNode; padded?: boolean }) {
  return (
    <div className={classes(styles.scroll, props.padded && styles.padded)}>
      {props.children}
    </div>
  );
}
