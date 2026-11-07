import { X } from "lucide-react";

import { IconAction } from "./Action";
import { MenuRows, type MenuEntry } from "./Menu";
import styles from "./MenuSheet.module.css";

/**
 * The proposed phone menu sheet: the anatomy of the library `Sheet` on a
 * dimmed page, with a grip, a title, and a close button, and the menu rows
 * at the 44 px touch size. It draws open in place, without a portal.
 */
export function MenuSheet(props: {
  title: string;
  entries: readonly MenuEntry[];
}) {
  return (
    <div className={styles.layer}>
      <div aria-hidden className={styles.backdrop} />
      <div
        aria-label={props.title}
        aria-modal
        className={styles.sheet}
        role="dialog"
      >
        <span aria-hidden className={styles.grip} />
        <div className={styles.header}>
          <h2 className={styles.title}>{props.title}</h2>
          <IconAction icon={X} label="Close" />
        </div>
        <div aria-label={props.title} className={styles.rows} role="menu">
          <MenuRows entries={props.entries} />
        </div>
      </div>
    </div>
  );
}
