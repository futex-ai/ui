import type { CSSProperties, ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

import { classes } from "../common/classes";
import { useRowMetrics } from "../common/Surface";
import styles from "./Menu.module.css";

export type MenuItem = {
  kind: "item";
  label: string;
  icon?: LucideIcon;
  /** Muted text at the end of the row, such as a count. */
  detail?: string;
  /** A choice in a group. The menu marks the current one. */
  checked?: boolean;
  danger?: boolean;
  /** The row under the pointer or the keyboard. */
  active?: boolean;
};

export type MenuEntry =
  | MenuItem
  | { kind: "label"; label: string }
  | { kind: "divider" }
  /** A short line that explains the choices, under them. */
  | { kind: "note"; text: string };

function Item(props: { entry: MenuItem }) {
  const { entry } = props;
  const metrics = useRowMetrics();
  const Icon = entry.icon;
  const choice = entry.checked !== undefined;
  return (
    <div
      aria-checked={choice ? entry.checked : undefined}
      className={classes(
        styles.item,
        entry.danger && styles.danger,
        entry.active && styles.active,
      )}
      role={choice ? "menuitemradio" : "menuitem"}
      tabIndex={-1}
    >
      {Icon ? (
        <Icon aria-hidden className={styles.icon} size={metrics.iconSize} />
      ) : null}
      <span className={styles.label}>{entry.label}</span>
      {entry.detail ? (
        <span className={styles.detail}>{entry.detail}</span>
      ) : null}
      {entry.checked ? (
        <Check aria-hidden className={styles.check} size={metrics.iconSize} />
      ) : null}
    </div>
  );
}

/**
 * The rows of a menu at the row size of the surface: 26 px rows in a
 * desktop menu, and 44 px rows in a phone sheet.
 */
export function MenuRows(props: { entries: readonly MenuEntry[] }) {
  return props.entries.map((entry, index) => {
    switch (entry.kind) {
      case "item":
        return <Item entry={entry} key={entry.label} />;
      case "label":
        return (
          <div className={styles.group} key={entry.label} role="presentation">
            {entry.label}
          </div>
        );
      case "note":
        return (
          <p className={styles.note} key={`note-${index}`} role="presentation">
            {entry.text}
          </p>
        );
      case "divider":
        return (
          <div
            className={styles.divider}
            key={`divider-${index}`}
            role="separator"
          />
        );
    }
  });
}

/** The positioned box around a trigger and its open menu. */
export function MenuAnchor(props: { children: ReactNode }) {
  return <div className={styles.anchor}>{props.children}</div>;
}

/**
 * The proposed static open menu: the dense menu surface, drawn open in the
 * page beside its trigger, without a portal or a measurement. It sits in a
 * `MenuAnchor` with the trigger.
 */
export function Menu(props: {
  label: string;
  entries: readonly MenuEntry[];
  align: "start" | "end";
  width: number;
}) {
  const style: CSSProperties = { width: props.width };
  return (
    <div
      aria-label={props.label}
      className={classes(styles.menu, styles[props.align])}
      role="menu"
      style={style}
    >
      <MenuRows entries={props.entries} />
    </div>
  );
}
