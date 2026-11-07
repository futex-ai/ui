import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { classes } from "../common/classes";
import styles from "./EmptyState.module.css";

/**
 * The proposed `EmptyState`: a quiet, centred message for a view with
 * nothing to show, with an optional body and actions. Its title is a
 * heading at the level that the caller gives. A panel state is smaller and
 * sits at the top of its panel.
 */
export function EmptyState(props: {
  icon: LucideIcon;
  title: string;
  /** The heading level of the title in its page. */
  level: 1 | 2 | 3;
  children?: ReactNode;
  actions?: ReactNode;
  size?: "page" | "panel";
}) {
  const Icon = props.icon;
  const Heading = (["h1", "h2", "h3"] as const)[props.level - 1];
  const panel = props.size === "panel";
  return (
    <div className={classes(styles.empty, panel && styles.panel)}>
      <span aria-hidden className={styles.mark}>
        <Icon size={panel ? 18 : 22} strokeWidth={1.75} />
      </span>
      <Heading className={styles.title}>{props.title}</Heading>
      {props.children ? <p className={styles.body}>{props.children}</p> : null}
      {props.actions ? (
        <div className={styles.actions}>{props.actions}</div>
      ) : null}
    </div>
  );
}
