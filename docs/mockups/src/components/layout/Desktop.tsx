import type { ReactNode } from "react";
import { PanelResizeHandle } from "@firna/ui/panel-resize";
import { useSharedUiTheme } from "@firna/ui/theme";

import { detailWidth, sidebarWidth } from "../../design/panelWidths";
import { noop } from "../../noop";
import { classes } from "../common/classes";
import { drawnHandleStyles, type HandleState } from "../common/drawnState";
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
 * changes panel. Each side column has a library resize handle on its inner
 * edge. The layout owns the widths. A static view draws each handle state
 * through the handle's line and grip styles.
 */
export function DesktopColumns(props: {
  columns: ColumnState;
  sidebar: ReactNode;
  main: ReactNode;
  detail?: ReactNode;
}) {
  const theme = useSharedUiTheme();
  const { sidebar, detail } = props.columns;
  return (
    <div className={styles.columns}>
      <aside
        aria-label="Projects"
        className={styles.sidebar}
        style={{ width: sidebar.width }}
      >
        {props.sidebar}
        <PanelResizeHandle
          {...drawnHandleStyles(theme, sidebar.handle)}
          accessibilityLabel="Resize the project list"
          edge="end"
          max={sidebarWidth.max}
          min={sidebarWidth.min}
          onChange={noop}
          value={sidebar.width}
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
          <PanelResizeHandle
            {...drawnHandleStyles(theme, detail.handle)}
            accessibilityLabel="Resize the changes panel"
            edge="start"
            max={detailWidth.max}
            min={detailWidth.min}
            onChange={noop}
            value={detail.width}
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
