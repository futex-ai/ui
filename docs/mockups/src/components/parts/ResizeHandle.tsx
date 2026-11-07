import type { PanelWidth } from "../../design/density";
import { classes } from "../common/classes";
import styles from "./ResizeHandle.module.css";

/** The drawn state of a handle: at rest, under the pointer, dragged, or focused. */
export type HandleState = "rest" | "hover" | "drag" | "focus";

/**
 * The proposed panel resize handle: a focusable window splitter on the
 * inner edge of a panel. At rest it is the hairline between the columns.
 * Under the pointer, during a drag, and with keyboard focus, the hairline
 * darkens and a short grip in the primary colour shows in its middle, so
 * no panel gets an accent edge. The caller owns the width and its storage.
 */
export function ResizeHandle(props: {
  label: string;
  /** The edge of the panel that the handle sits on. */
  edge: "start" | "end";
  bounds: PanelWidth;
  width: number;
  state: HandleState;
}) {
  return (
    <div
      aria-label={props.label}
      aria-orientation="vertical"
      aria-valuemax={props.bounds.max}
      aria-valuemin={props.bounds.min}
      aria-valuenow={props.width}
      className={classes(
        styles.handle,
        styles[props.edge],
        props.state !== "rest" && styles.shown,
        props.state === "focus" && styles.focused,
      )}
      role="separator"
      tabIndex={0}
    >
      <span aria-hidden className={styles.line} />
      <span aria-hidden className={styles.grip} />
    </div>
  );
}
