import type { ReactNode } from "react";

import { classes } from "../common/classes";
import styles from "./Notice.module.css";

export type NoticeTone = "neutral" | "urgent";

/**
 * The proposed `Notice`: a short message in a box with a full outline and
 * a tinted fill, never an accent edge. An urgent notice is an alert, so a
 * screen reader announces it when it appears. The actions sit at the end
 * of a wide notice and move under the text in a narrow one.
 */
export function Notice(props: {
  tone?: NoticeTone;
  /** A decorative glyph, such as an icon or a spinner. */
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const urgent = props.tone === "urgent";
  return (
    <div
      className={classes(styles.notice, urgent && styles.urgent)}
      role={urgent ? "alert" : undefined}
    >
      <span aria-hidden className={styles.icon}>
        {props.icon}
      </span>
      <div className={styles.content}>
        <div className={styles.text}>
          <p className={styles.title}>{props.title}</p>
          {props.children ? (
            <p className={styles.body}>{props.children}</p>
          ) : null}
        </div>
        {props.actions ? (
          <div className={styles.actions}>{props.actions}</div>
        ) : null}
      </div>
    </div>
  );
}
